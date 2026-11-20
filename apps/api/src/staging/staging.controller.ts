import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import type { Response } from 'express';
import { AuthGuard } from '../common/auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { AuditService } from '../common/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';
import crypto from 'node:crypto';
import { LegacyService } from '../legacy/legacy.service.js';

// Rules confirmed by cross-validation (2026-11-16). Preserve orphans; never delete a source record.
const RULES = [
  ['alunos_contrato', 'contrato_aluno', 'ctt_alu_id_alu', 'alunos'],
  ['matricula_aluno', 'montar_turma', 'freq_id_aluno', 'alunos'],
  ['matricula_turma', 'montar_turma', 'freq_id_turma', 'curso'],
  ['matricula_curso', 'montar_turma', 'freq_id_curso', 'curso_appa'],
  ['matricula_contrato', 'montar_turma', 'freq_id_contrato', 'contrato_aluno'],
  ['frequencia_aluno', 'frequencia_master', 'freq_id_aluno', 'alunos'],
  ['frequencia_turma', 'frequencia_master', 'freq_id_turma', 'curso'],
  ['frequencia_aula', 'frequencia_master', 'freq_id_data_aula', 'data_aula'],
  ['nota_aluno', 'notas', 'nota_id_aluno', 'alunos'],
  ['nota_disciplina', 'notas', 'nota_id_disciplina', 'disciplinas'],
  ['pagamento_contrato', 'historico_pgto_contrato', 'id_contrato', 'contrato_aluno'],
  ['calendario_contrato', 'calendario_10_porcento', 'c10p_id_ctt_alu', 'contrato_aluno'],
  ['candidatura_vaga', 'vaga_site_candidatos_participantes', 'vscp_id_vaga', 'vaga_site'],
] as const;


const isLocalImportEnabled = () => {
  if (process.env.NODE_ENV !== 'development' || process.env.LOCAL_SQL_IMPORT_ENABLED !== 'true') return false;
  try { return ['127.0.0.1', 'localhost'].includes(new URL(process.env.DATABASE_URL || '').hostname); } catch { return false; }
};
const privateFolder = () => path.resolve(process.cwd(), '../../.local-private-imports');
const fileExtension = (name: string) => name.toLowerCase().endsWith('.sql.gz') ? '.sql.gz' : '.sql';
const csvValue = (value: unknown) => {
  const source = String(value ?? '');
  const safe = /^[=+@-]/.test(source) ? `'${source}` : source;
  return `"${safe.replace(/"/g, '""')}"`;
};
const TARGETS: Record<string, string> = { alunos: 'people', empresas: 'companies', curso_appa: 'courses', curso: 'groups', disciplinas: 'disciplines', montar_turma: 'enrollments', frequencia_master: 'attendance' };

@Controller('staging') @UseGuards(AuthGuard)
export class StagingController {
  constructor(private readonly db: PrismaService, private readonly audit: AuditService, private readonly legacy: LegacyService) { }
  private check(u: any) { if (u.role !== 'SUPER_ADMIN') throw new ForbiddenException('Acesso restrito a importacao tecnica'); }
  private checkOriginal(u: any) { this.check(u); if (!isLocalImportEnabled()) throw new ForbiddenException('O SQL original so pode ser importado em desenvolvimento local explicitamente habilitado.'); }
  private startWorker(file: string, id: string, token: string) {
    const task = spawn(process.execPath, file === 'stage' ? ['src/staging/original-import.worker.mjs', id, token] : ['--import', 'tsx', 'scripts/promote-batch.ts', id, token],
      { cwd: process.cwd(), env: { ...process.env }, stdio: 'ignore', windowsHide: true, detached: false });
    task.once('error', () => { void this.db.legacyImportBatch.updateMany({ where: { id, importWorkerToken: token }, data: { status: 'FAILED', message: 'Falha ao iniciar processo local. Verifique Node e Docker.' } }).catch(() => { }); });
    task.unref();
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => { const dir = privateFolder(); fs.mkdirSync(dir, { recursive: true, mode: 0o700 }); cb(null, dir); },
      filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${fileExtension(file.originalname)}`),
    }),
    limits: { fileSize: 4 * 1024 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!isLocalImportEnabled()) return cb(new ForbiddenException('Importacao de SQL original desabilitada fora do desenvolvimento local'), false);
      if (!/\.sql(\.gz)?$/i.test(file.originalname)) return cb(new BadRequestException('Use arquivo .sql ou .sql.gz'), false);
      cb(null, true);
    },
  }))
  async upload(@CurrentUser() u: any, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Selecione o arquivo SQL original');
    try { this.checkOriginal(u); } catch (e) { try { fs.unlinkSync(file.path); } catch { } throw e; }
    const id = path.basename(file.filename).split('.')[0];
    try {
      const handle = fs.openSync(file.path, 'r');
      const magic = Buffer.alloc(2); try { fs.readSync(handle, magic, 0, 2, 0); } finally { fs.closeSync(handle); }
      if (file.filename.endsWith('.gz') && (magic[0] !== 0x1f || magic[1] !== 0x8b)) throw new BadRequestException('Arquivo .gz sem cabecalho gzip valido');
      const hash = crypto.createHash('sha256');
      for await (const chunk of fs.createReadStream(file.path)) hash.update(chunk as Buffer);
      try { fs.chmodSync(file.path, 0o600); } catch {/* NTFS may manage ACL separately. */ }
      const b = await this.db.legacyImportBatch.create({        
data: {          
id, source: 'SISCAPRO_ORIGINAL_LOCAL', status: 'UPLOADED', stagingPhase: 'UPLOAD',
          fileName: path.basename(file.originalname).slice(0, 180), fileBytes: BigInt(file.size), fileHash: hash.digest('hex'), message: 'Arquivo recebido e isolado. Nao foram alteradas tabelas operacionais.'        
}      
});
      await this.db.legacyImportEvent.create({        
data: {
          id: crypto.randomUUID(),
          batchId: id,
          phase: 'UPLOAD',
          level: 'SUCCESS',
          message: `Arquivo recebido: ${(file.size / 1048576).toFixed(1)} MiB.`
        }      
});
      await this.audit.log({ userId: u.sub, action: 'ORIGINAL_SQL_UPLOAD', entity: 'LegacyImportBatch', entityId: id, metadata: { bytes: file.size } });
      return { id: b.id, status: b.status, fileName: b.fileName, fileBytes: String(b.fileBytes) };
    } catch (e) { try { fs.unlinkSync(file.path); } catch { } throw e; }
  }
  private async launchImport(id: string, allowStale = false, requestedScope?: string) {
    const b = await this.db.legacyImportBatch.findUniqueOrThrow({ where: { id } });
    if (b.source !== 'SISCAPRO_ORIGINAL_LOCAL') throw new BadRequestException('Lote nao pertence ao importador local');
    const accepted = ['UPLOADED', 'FAILED', 'PAUSED', 'CANCELLED', 'STAGED'];
    if (!accepted.includes(b.status) && !allowStale) throw new BadRequestException('Lote nao esta pausado nem aguardando processamento');
    if (b.status === 'STAGED') {
      const incomplete = await this.db.legacyImportTableStatus.count({ where: { batchId: id, status: 'FAILED' } });
      if (!incomplete) throw new BadRequestException('Staging ja concluido. Use Transformar dados mapeados.');
    }
    const folder = privateFolder();
    if (!fs.existsSync(path.join(folder, `${id}.sql`)) && !fs.existsSync(path.join(folder, `${id}.sql.gz`))) throw new BadRequestException('SQL privado nao encontrado; nao e possivel retomar.');
    // A previous V3.3 worker has no cooperative pause. Do not race its lock.
    if (fs.existsSync(path.join(folder, 'import-worker.lock'))) throw new BadRequestException('Existe um worker da versao anterior. Confirme que terminou e remova o bloqueio antigo somente apos verificar o processo.');
    const running = await this.db.legacyImportBatch.count({ where: { id: { not: id }, status: { in: ['RUNNING', 'PROMOTING'] } } });
    if (running) throw new BadRequestException('Outra importacao esta em execucao. Aguarde ou verifique o heartbeat do lote anterior.');
    const wantedScope = requestedScope === 'FULL' ? 'FULL' : 'PRIORITY_SEVEN';
    const checkpointCount = await this.db.legacyImportChunkCheckpoint.count({ where: { batchId: id } });
    if (checkpointCount && requestedScope && wantedScope !== b.importScope) {
      throw new BadRequestException('O escopo nao pode mudar apos a primeira confirmacao. Crie outro lote para o modo completo.');
    }
    const effectiveScope = checkpointCount ? b.importScope : wantedScope;
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    const resumeTransform = b.stagingPhase === 'TRANSFORM';
    const allowed = allowStale ? { id, status: { in: ['RUNNING', 'PROMOTING'] } } : { id, status: { in: accepted } };
    const changed = await this.db.legacyImportBatch.updateMany({ where: allowed, data: { status: resumeTransform ? 'PROMOTING' : 'RUNNING', importScope: effectiveScope, importControl: 'RUN', importWorkerToken: token, importHeartbeat: new Date(), message: 'Retomando importacao pelos checkpoints persistidos.' } });
    if (!changed.count) throw new BadRequestException('O estado do lote mudou. Atualize a pagina.');
    this.startWorker(resumeTransform ? 'promote' : 'stage', id, token);
    return { id, status: resumeTransform ? 'PROMOTING' : 'RUNNING', mode: 'INCREMENTAL_RESUME', importScope: effectiveScope };
  }
  @Post('start/:id') async start(@CurrentUser() u: any, @Param('id') id: string, @Body() body: any) {
    this.checkOriginal(u);
    if (body?.confirm !== 'PROCESS_ORIGINAL_SQL_LOCALLY') throw new BadRequestException('Confirme o processamento do SQL original em ambiente local isolado');
    const answer = await this.launchImport(id, false, body?.importScope);
    await this.db.legacyImportEvent.create({      
data: {
        id: crypto.randomUUID(),
        batchId: id,
        phase: 'SYSTEM',
        level: 'INFO',
        message: answer.importScope === 'PRIORITY_SEVEN'
          ? 'Inicio solicitado: prioridade para os sete cadastros mapeados.'
          : 'Inicio solicitado: processamento de todas as tabelas elegiveis.'
      }    
});
    await this.audit.log({ userId: u.sub, action: 'ORIGINAL_SQL_INCREMENTAL_STARTED', entity: 'LegacyImportBatch', entityId: id });
    return answer;
  }
  @Post('pause/:id') async pause(@CurrentUser() u: any, @Param('id') id: string) {
    this.checkOriginal(u);
    const r = await this.db.legacyImportBatch.updateMany({ where: { id, status: { in: ['RUNNING', 'PROMOTING'] } }, data: { importControl: 'PAUSE_REQUESTED' } });
    if (!r.count) throw new BadRequestException('Nao ha processamento ativo neste lote');
    await this.audit.log({ userId: u.sub, action: 'ORIGINAL_SQL_PAUSE_REQUESTED', entity: 'LegacyImportBatch', entityId: id });
    return { id, requested: 'PAUSE', message: 'Pausa solicitada. O bloco corrente sera confirmado ou revertido antes de parar.' };
  }
  @Post('cancel/:id') async cancel(@CurrentUser() u: any, @Param('id') id: string) {
    this.checkOriginal(u);
    const r = await this.db.legacyImportBatch.updateMany({ where: { id, status: { in: ['RUNNING', 'PROMOTING'] } }, data: { importControl: 'CANCEL_REQUESTED' } });
    if (!r.count) throw new BadRequestException('Nao ha processamento ativo neste lote');
    await this.audit.log({ userId: u.sub, action: 'ORIGINAL_SQL_CANCEL_REQUESTED', entity: 'LegacyImportBatch', entityId: id });
    return { id, requested: 'CANCEL', message: 'Cancelamento cooperativo solicitado. SQL e checkpoints permanecerao guardados.' };
  }
  @Post('recover/:id') async recover(@CurrentUser() u: any, @Param('id') id: string, @Body() body: any) {
    this.checkOriginal(u);
    if (body?.confirm !== 'RECOVER_STALE_IMPORT') throw new BadRequestException('Confirme explicitamente a recuperacao do lote interrompido');
    const b = await this.db.legacyImportBatch.findUniqueOrThrow({ where: { id } });
    if (!['RUNNING', 'PROMOTING'].includes(b.status)) throw new BadRequestException('Recuperacao apenas para lotes marcados como RUNNING ou PROMOTING');
    if (b.importHeartbeat && Date.now() - b.importHeartbeat.getTime() < 120000) throw new BadRequestException('Worker ainda possui heartbeat recente. Solicite pausa e aguarde.');
    const result = await this.launchImport(id, true);
    await this.audit.log({ userId: u.sub, action: 'ORIGINAL_SQL_STALE_RECOVERY', entity: 'LegacyImportBatch', entityId: id });
    return result;
  }
  @Post('reuse/:id')
  async reuseOriginalSql(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    this.checkOriginal(user);
    if (body?.confirm !== 'REUSE_PRIVATE_SQL') {
      throw new BadRequestException('Confirme a criacao do lote complementar');
    }
    const origem = await this.db.legacyImportBatch.findUniqueOrThrow({ where: { id } });
    if (origem.source !== 'SISCAPRO_ORIGINAL_LOCAL' ||
      ['RUNNING', 'PROMOTING'].includes(origem.status)) {
      throw new BadRequestException('Selecione um lote local que nao esteja em execucao');
    }
    const extensao = fs.existsSync(path.join(privateFolder(), `${id}.sql.gz`))
      ? '.sql.gz'
      : '.sql';
    const arquivoOriginal = path.join(privateFolder(), `${id}${extensao}`);
    if (!fs.existsSync(arquivoOriginal)) {
      throw new BadRequestException('Arquivo SQL original nao localizado');
    }
    const escopoNovo = body?.importScope === 'FULL' ? 'FULL' : 'PRIORITY_SEVEN';
    const novoId = crypto.randomUUID();
    const arquivoNovo = path.join(privateFolder(), `${novoId}${extensao}`);
    try {
      await fs.promises.link(arquivoOriginal, arquivoNovo);
    } catch (erro: any) {
      if (!['EXDEV', 'EPERM', 'EACCES', 'ENOTSUP'].includes(erro?.code)) {
        throw erro;
      }
      await fs.promises.copyFile(arquivoOriginal, arquivoNovo, fs.constants.COPYFILE_EXCL);
    }
    try {
      await this.db.legacyImportBatch.create({
        data: {
          id: novoId,
          source: 'SISCAPRO_ORIGINAL_LOCAL',
          status: 'UPLOADED',
          stagingPhase: 'UPLOAD',
          fileName: origem.fileName,
          fileBytes: origem.fileBytes,
          fileHash: origem.fileHash,
          importScope: escopoNovo,
          message: 'Novo lote criado com o arquivo privado ja recebido.'
        }
      });
      await this.db.legacyImportEvent.create({
        data: {
          id: crypto.randomUUID(),
          batchId: novoId,
          phase: 'UPLOAD',
          level: 'SUCCESS',
          message: escopoNovo === 'FULL'
            ? 'Arquivo reutilizado para importacao completa, sem novo envio.'
            : 'Arquivo reutilizado para importacao prioritaria, sem novo envio.'
        }
      });
    } catch (erro) {
      await fs.promises.unlink(arquivoNovo).catch(() => undefined);
      throw erro;
    }
    await this.audit.log({
      userId: user.sub,
      action: 'ORIGINAL_SQL_REUSE',
      entity: 'LegacyImportBatch',
      entityId: novoId,
      metadata: { sourceBatchId: id }
    });
    return { id: novoId, status: 'UPLOADED', importScope: escopoNovo };
  }

  @Get('events/:id')
  async events(@CurrentUser() user: any, @Param('id') id: string) {
    this.check(user);
    const exists = await this.db.legacyImportBatch.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!exists) {
      throw new BadRequestException('Lote de importacao nao localizado');
    }
    return this.db.legacyImportEvent.findMany({
      where: { batchId: id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 120
    });
  }

  @Get('chunks/:id') async chunks(@CurrentUser() u: any, @Param('id') id: string, @Query('phase') phase = 'RESTORE', @Query('page') page = '1') {
    this.check(u);
    if (!['RESTORE', 'STAGING', 'TRANSFORM'].includes(phase)) throw new BadRequestException('Etapa invalida');
    const n = Math.max(1, Math.min(10000, parseInt(page, 10) || 1));
    const where = { batchId: id, phase };
    const [items, total] = await Promise.all([this.db.legacyImportChunkCheckpoint.findMany({ where, orderBy: { sequence: 'desc' }, skip: (n - 1) * 50, take: 50 }), this.db.legacyImportChunkCheckpoint.count({ where })]);
    return { items: items.map(c => ({ ...c, startOffset: c.startOffset?.toString() || null, endOffset: c.endOffset?.toString() || null })), page: n, pageSize: 50, total };
  }
  @Post('transform/:id') async transform(@CurrentUser() u: any, @Param('id') id: string, @Body() body: any) {
    this.checkOriginal(u);
    if (body?.confirm !== 'BACKUP_CONFIRMED_TRANSFORM_SEVEN') throw new BadRequestException('Confirme backup antes de promover dados reais para o banco novo');
    const b = await this.db.legacyImportBatch.findUniqueOrThrow({ where: { id } });
    if (b.source !== 'SISCAPRO_ORIGINAL_LOCAL' || !['STAGED', 'STAGED_PRIORITY', 'PROMOTED_PARTIAL'].includes(b.status)) throw new BadRequestException('O lote precisa estar preservado no staging antes da transformacao');
    const pendingTables = await this.db.legacyImportTableStatus.count({ where: { batchId: id, status: 'FAILED' } });
    if (pendingTables) throw new BadRequestException('Existem tabelas com erro. Corrija e retome antes de transformar.');
    const running = await this.db.legacyImportBatch.count({ where: { status: { in: ['RUNNING', 'PROMOTING'] } } });
    if (running) throw new BadRequestException('Ja existe outro processamento em execucao');
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    await this.db.legacyImportBatch.update({ where: { id }, data: { status: 'PROMOTING', stagingPhase: 'TRANSFORM', importControl: 'RUN', importWorkerToken: token, importHeartbeat: new Date(), message: 'Conversao incremental das sete entidades mapeadas iniciada.' } });
    this.startWorker('promote', id, token);
    await this.audit.log({ userId: u.sub, action: 'ORIGINAL_SQL_TRANSFORM_STARTED', entity: 'LegacyImportBatch', entityId: id });
    return { id, status: 'PROMOTING', entities: Object.values(TARGETS) };
  }
  @Get('tables/:id') async tableResults(@CurrentUser() u: any, @Param('id') id: string) {
    this.check(u); return this.db.legacyImportTableStatus.findMany({ where: { batchId: id }, orderBy: { sourceTable: 'asc' } });
  }
  @Get('results/:id') async recordResults(@CurrentUser() u: any, @Param('id') id: string, @Query('status') status = '', @Query('page') page = '1') {
    this.check(u); const n = Math.max(1, Math.min(100000, parseInt(page, 10) || 1));
    const where = { batchId: id, ...(status ? { status } : {}) };
    const [items, total] = await Promise.all([this.db.legacyImportRecordResult.findMany({ where, orderBy: { processedAt: 'desc' }, take: 100, skip: (n - 1) * 100 }), this.db.legacyImportRecordResult.count({ where })]);
    return { items, total, page: n, pageSize: 100 };
  }
  @Get('export/:id') async exportResults(@CurrentUser() u: any, @Param('id') id: string, @Res() res: Response) {
    this.check(u); const batch = await this.db.legacyImportBatch.findUniqueOrThrow({ where: { id } });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', `attachment; filename="importacao-${batch.id}.csv"`);
    res.write('\ufeff');
    res.write('tipo;origem;chave_origem;destino;id_destino;estado;motivo;descricao\n');
    const emit = async (parts: unknown[]) => { const row = parts.map(csvValue).join(';') + '\n'; if (!res.write(row)) await once(res, 'drain'); };
    for (const t of await this.db.legacyImportTableStatus.findMany({ where: { batchId: id }, orderBy: { sourceTable: 'asc' } })) {
      await emit(['TABELA', t.sourceTable, '', t.targetEntity, '', t.status, t.reasonCode, t.reason]);
    }
    let cursor: string | undefined;
    while (true) {
      const rows = await this.db.legacyImportRecordResult.findMany({ where: { batchId: id }, orderBy: { id: 'asc' }, take: 500, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
      if (!rows.length) break;
      for (const r of rows) await emit(['REGISTRO', r.sourceTable, r.sourceKey, r.targetEntity, r.targetId, r.status, r.reasonCode, r.explanation]);
      cursor = rows[rows.length - 1].id;
    }
    res.end();
  }


  @Get('capabilities') capabilities(@CurrentUser() u: any) { this.check(u); return { localImportEnabled: isLocalImportEnabled(), supported: ['.sql', '.sql.gz'], importScopes: ['PRIORITY_SEVEN', 'FULL'], mappedEntities: Object.values(TARGETS) }; }
  @Get('batches') async batches(@CurrentUser() u: any) { this.check(u); const rows = await this.db.legacyImportBatch.findMany({ orderBy: { startedAt: 'desc' }, take: 30 }); return rows.map(({ importWorkerToken, ...b }) => ({ ...b, fileBytes: b.fileBytes?.toString() || null, restoreTotalBytes: b.restoreTotalBytes?.toString() || null, restoreProcessedBytes: b.restoreProcessedBytes.toString(), restoreScannedBytes: b.restoreScannedBytes.toString() })); }
  @Get('status') async status(@CurrentUser() u: any) {
    this.check(u);
    const [batches, tables, issues] = await Promise.all([
      this.db.legacyImportBatch.findMany({ orderBy: { startedAt: 'desc' }, take: 20 }),
      this.db.legacyRawRow.groupBy({ by: ['sourceTable'], _count: { _all: true }, orderBy: { sourceTable: 'asc' } }),
      this.db.legacyImportIssue.groupBy({ by: ['ruleCode'], _count: { _all: true } }),
    ]);
    return { batches: batches.map(({ importWorkerToken, ...b }) => ({ ...b, fileBytes: b.fileBytes?.toString() || null, restoreTotalBytes: b.restoreTotalBytes?.toString() || null, restoreProcessedBytes: b.restoreProcessedBytes.toString(), restoreScannedBytes: b.restoreScannedBytes.toString() })), tables: tables.map(t => ({ table: t.sourceTable, records: t._count._all })), issues: issues.map(i => ({ rule: i.ruleCode, records: i._count._all })), pdfsImported: false };
  }
  @Get('issues') async issues(@CurrentUser() u: any, @Query('rule') rule?: string, @Query('page') page = '1') {
    this.check(u);
    const n = Math.max(1, Math.min(10000, parseInt(page, 10) || 1));
    return this.db.legacyImportIssue.findMany({ where: rule ? { ruleCode: rule } : {}, orderBy: { detectedAt: 'desc' }, take: 100, skip: (n - 1) * 100 });
  }
  @Get('rules') rules(@CurrentUser() u: any) { this.check(u); return RULES.map(([code, sourceTable, field, targetTable]) => ({ code, sourceTable, field, targetTable })); }
  @Post('promote/:entity') async promote(@CurrentUser() u: any, @Param('entity') entity: string, @Body() body: any) {
    this.check(u);
    if (!['PROMOTE_ANONYMIZED_STAGING', 'BACKUP_CONFIRMED_TRANSFORM_SEVEN'].includes(body?.confirm)) throw new BadRequestException('Confirme explicitamente a promocao do staging');
    const cursor = String(body?.after ?? ''), limit = Number(body?.limit ?? 50);
    const result = await this.legacy.promoteFromStaging(entity, cursor, limit, body?.batchId);
    await this.audit.log({ userId: u.sub, action: 'PROMOTE_VERIFIED_STAGING', entity, metadata: { read: result.read, written: result.written, errors: result.errors } });
    return result;
  }
  @Post('reconcile') async reconcile(@CurrentUser() u: any) {
    this.check(u);
    const results = [];
    for (const [rule, sourceTable, field, targetTable] of RULES) {
      // Fixed SQL, bind all data values. Counts are reliable, inserts are capped to avoid overload.
      const counts = await this.db.$queryRaw<{ unresolved: bigint }[]>`
        SELECT COUNT(*) AS unresolved FROM "LegacyRawRow" AS src
        LEFT JOIN "LegacyRawRow" AS dst
          ON dst."sourceTable" = ${targetTable} AND dst."sourceKey" = (src."rowData"->>${field})
        WHERE src."sourceTable"=${sourceTable}
          AND NULLIF(TRIM(src."rowData"->>${field}), '') IS NOT NULL
          AND src."rowData"->>${field} NOT IN ('0', '-1', 'null') AND dst."id" IS NULL`;
      const total = Number(counts[0]?.unresolved || 0);
      if (total) {
        const candidates = await this.db.$queryRaw<{ sourceKey: string; targetKey: string }[]>`
          SELECT src."sourceKey", src."rowData"->>${field} AS "targetKey"
          FROM "LegacyRawRow" AS src
          LEFT JOIN "LegacyRawRow" AS dst
            ON dst."sourceTable" = ${targetTable} AND dst."sourceKey" = (src."rowData"->>${field})
          WHERE src."sourceTable"=${sourceTable}
            AND NULLIF(TRIM(src."rowData"->>${field}), '') IS NOT NULL
            AND src."rowData"->>${field} NOT IN ('0', '-1', 'null') AND dst."id" IS NULL
          ORDER BY src."sourceKey" LIMIT 10000`;
        for (let k = 0; k < candidates.length; k += 250) {
          const chunk = candidates.slice(k, k + 250);
          await this.db.legacyImportIssue.createMany({            
data: chunk.map(x => ({
              id: crypto.randomUUID(), ruleCode: rule, sourceTable, sourceKey: x.sourceKey, targetTable, targetKey: x.targetKey,
              observation: 'Referencia ausente no staging. Preservar registro principal e conciliar manualmente.',
            })), skipDuplicates: true          
});
        }
      }
      results.push({ rule, sourceTable, targetTable, unresolved: total, issuesRecordedLimit: Math.min(total, 10000) });
    }
    await this.audit.log({ userId: u.sub, action: 'RECONCILE_LEGACY_STAGING', entity: 'LegacyImportIssue', metadata: { rules: results.length } });
    return { results, notes: 'Referencias nulas/0/-1 sao opcionais; nenhum dado operacional foi alterado.' };
  }
}

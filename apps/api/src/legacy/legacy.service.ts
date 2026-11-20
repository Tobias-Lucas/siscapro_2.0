import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import mysql, { Pool } from 'mysql2/promise';
import crypto from 'node:crypto';

import { PrismaService } from '../common/prisma.service.js';
import { normalizeLegacyBirthDate, classifyPromotionFailure } from './legacy-normalization.js';

const SOURCE = 'siscapro';
const QUERIES: Record<string, { table: string; key: string }> = {
  people: { table: 'alunos', key: 'alu_id' },
  companies: { table: 'empresas', key: 'emp_id' },
  courses: { table: 'curso_appa', key: 'curappa_id' },
  groups: { table: 'curso', key: 'curso_id' },
  disciplines: { table: 'disciplinas', key: 'disc_id' },
  disciplineTeachers: { table: 'disciplinas_vinculos_prof', key: 'dvp_id' },
  courseHours: { table: 'curso_horarios', key: 'ch_id' },
  teachingDays: { table: 'curso_dias_aulas', key: 'cda_id' },
  enrollments: { table: 'montar_turma', key: 'freq_id' },
  attendance: { table: 'frequencia_master', key: 'freq_id' },
};
const PREVIEWS: Record<string, string> = {
  people: 'SELECT alu_id,alu_nome,alu_cpf,alu_email,alu_status FROM alunos LIMIT ?',
  companies: 'SELECT emp_id,emp_cnpj,emp_razao_social,emp_fantasia,emp_status FROM empresas LIMIT ?',
  courses: 'SELECT curappa_id,curappa_curso,curappa_sigla,curappa_mod,curappa_status FROM curso_appa LIMIT ?',
  groups: 'SELECT curso_id,curso_nome,curso_tipo_turma,curso_id_curso,curso_status FROM curso LIMIT ?',
  enrollments: 'SELECT freq_id,freq_id_aluno,freq_id_turma,freq_id_curso,freq_id_empresa,freq_id_contrato,freq_dt_listar_nome_ini,freq_dt_listar_nome_fim FROM montar_turma LIMIT ?',
  attendance: 'SELECT freq_id,freq_data_aula,freq_id_aluno,freq_id_turma,freq_pf,freq_justificada FROM frequencia_master LIMIT ?',
  contracts: 'SELECT ctt_alu_id,ctt_alu_id_alu,ctt_id_curso,ctt_id_emp,ctt_alu_mod,ctt_alu_dt_ini,ctt_alu_dt_fim FROM contrato_aluno LIMIT ?',
  vacancies: 'SELECT vs_id,vs_id_emp,vs_area,vs_perfil_vaga,vs_qtde,vs_status FROM vaga_site LIMIT ?',
  requests: 'SELECT req_id,req_id_aluno,req_solicitacao,req_status,req_dt_abertura FROM requerimento LIMIT ?',
  disciplines: 'SELECT disc_id,disc_id_curso,disc_disciplina,disc_parte,disc_ch,disc_status FROM disciplinas LIMIT ?',
  disciplineTeachers: 'SELECT dvp_id,dvp_id_prof,dvp_id_curso,dvp_id_disc FROM disciplinas_vinculos_prof LIMIT ?',
  courseHours: 'SELECT ch_id,ch_id_curso,ch_horaI,ch_horaF,ch_turno,ch_unidade FROM curso_horarios LIMIT ?',
  teachingDays: 'SELECT cda_id,cda_id_curso,cda_id_horario,cda_parteTP FROM curso_dias_aulas LIMIT ?',
};
const active = (value: unknown) => String(value ?? '').trim().toLowerCase() === 'ativo' ? 'ACTIVE' : 'INACTIVE';
const text = (value: any) => value === null || value === undefined || value === '' ? null : String(value).trim();
const fingerprint = (row: any) => crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');
const nonzero = (value: any) => value !== null && value !== undefined && value !== '' && Number(value) !== 0;
const legacyBool = (value: any) => String(value ?? '').trim() === '1';
const safeLegacyDate = (value: unknown) => {
  if (!value || String(value).startsWith('0000-00-00')) return null;
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) throw new Error('Data de legado invalida');
  return date;
};

@Injectable()
export class LegacyService implements OnModuleDestroy {
  private pool?: Pool;
  constructor(private readonly prisma: PrismaService) {}
  enabled() { const source=String(process.env.LEGACY_DB_NAME||'').toLowerCase();return process.env.LEGACY_ENABLED === 'true' && (source.includes('anon') || source.includes('dev')); }
  private db() {
    if (!this.enabled()) throw new BadRequestException('Integracao legado desabilitada. Configure acesso MariaDB somente leitura.');
    if (!this.pool) this.pool = mysql.createPool({
      host: process.env.LEGACY_DB_HOST, port: Number(process.env.LEGACY_DB_PORT || 3306),
      database: process.env.LEGACY_DB_NAME, user: process.env.LEGACY_DB_USER, password: process.env.LEGACY_DB_PASSWORD,
      ssl: process.env.LEGACY_DB_SSL === 'true' ? {} : undefined, connectionLimit: 3,
      connectTimeout: 15000, multipleStatements: false,
    });
    return this.pool;
  }
  async onModuleDestroy() { await this.pool?.end(); }
  async status() {
    if (!this.enabled()) return { enabled: false, connected: false, message: 'Conector desabilitado; base PostgreSQL independente.' };
    try {
      const [rows]: any = await this.db().query('SELECT DATABASE() db, VERSION() version, NOW() serverTime');
      return { enabled: true, connected: true, server: rows[0] };
    } catch { return { enabled: true, connected: false, message: 'Nao foi possivel conectar ao banco legado. Confira host, TLS e credenciais.' }; }
  }
  async tables() {
    const [rows]: any = await this.db().query('SELECT TABLE_NAME tableName, TABLE_ROWS estimatedRows FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME');
    return rows;
  }
  async preview(entity: string, limit = 20) {
    if (!PREVIEWS[entity]) throw new BadRequestException('Entidade nao suportada');
    const safe = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 100) : 20;
    const [rows] = await this.db().query(PREVIEWS[entity], [safe]);
    return rows;
  }
  private mapped(entity: string, legacyId: any) {
    return this.prisma.legacyMapping.findUnique({ where: { source_entity_legacyId: { source: SOURCE, entity, legacyId: String(legacyId) } } });
  }
  private map(entity: string, legacyId: any, newId: string, row: any) {
    return this.prisma.legacyMapping.upsert({
      where: { source_entity_legacyId: { source: SOURCE, entity, legacyId: String(legacyId) } },
      update: { newId, fingerprint: fingerprint(row), syncedAt: new Date() },
      create: { source: SOURCE, entity, legacyId: String(legacyId), newId, fingerprint: fingerprint(row) },
    });
  }
  private async write(entity: string, x: any) {
    if (['users','teachers','teacherAssignments'].includes(entity)) {
      throw new BadRequestException('Sincronizacao de contas e facilitadores legados esta bloqueada. Nao importar hashes MD5; provisionar contas novas com Argon2id e reconciliar os vinculos manualmente.');
    }
    if (entity === 'people') {
      const id = x.alu_id;
      const data: any = {
        fullName: text(x.alu_nome) || `Aluno ${id}`, socialName: text(x.alu_nome_social),
        cpf: text(x.alu_cpf), rg: text(x.alu_rg), birthDate: normalizeLegacyBirthDate(x.alu_nascto),
        sex: text(x.alu_sexo), email: text(x.alu_email), phone: text(x.alu_tel1),
        secondaryPhone: text(x.alu_tel2), zipCode: text(x.alu_cep), address: text(x.alu_end),
        addressNumber: text(x.alu_nr_casa), addressExtra: text(x.alu_complemento),
        district: text(x.alu_bairro), city: text(x.alu_cidade), state: text(x.alu_uf),
        motherName: text(x.alu_mae), fatherName: text(x.alu_pai), legalGuardian: text(x.alu_resp_legal),
        guardianCpf: text(x.alu_cpf_resp_legal), guardianEmail: text(x.alu_email_resp_legal),
        status: String(x.alu_status) === '1' ? 'ACTIVE' : 'INACTIVE',
      };
      const m = await this.mapped(entity, id);
      const person = m ? await this.prisma.person.update({ where: { id: m.newId }, data }) : await this.prisma.person.create({ data });
      await this.map(entity, id, person.id, x);
      return;
    }
    if (entity === 'companies') {
      const id = x.emp_id;
      const data: any = {
        cnpj: text(x.emp_cnpj), legalName: text(x.emp_razao_social) || text(x.emp_fantasia) || `Empresa ${id}`,
        tradeName: text(x.emp_fantasia), email: text(x.emp_email), financeEmail: text(x.emp_email_financeiro),
        phone: text(x.emp_celular) || text(x.emp_fone_fixo), zipCode: text(x.emp_cep),
        address: text(x.emp_endereco), addressNumber: text(x.emp_nr_predio), district: text(x.emp_bairro),
        city: text(x.emp_cidade), state: text(x.emp_uf), legalRep: text(x.emp_rep_legal), status: active(x.emp_status),
      };
      const m = await this.mapped(entity, id);
      const company = m ? await this.prisma.company.update({ where: { id: m.newId }, data }) : await this.prisma.company.create({ data });
      await this.map(entity, id, company.id, x);
      return;
    }
    if (entity === 'courses') {
      const id = x.curappa_id;
      const rawHours = Number.parseInt(String(x.curappa_ch_total ?? ''), 10);
      const data: any = { name: text(x.curappa_curso) || `Curso ${id}`, code: text(x.curappa_sigla),
        modality: text(x.curappa_mod), workload: Number.isFinite(rawHours) ? rawHours : null,
        theoryWorkloadRaw: text(x.curappa_ch_atv_teor), practiceWorkloadRaw: text(x.curappa_ch_atv_prat),
        authorizationProtocol: text(x.curappa_protocolo), legacySegmentCode: text(x.curappa_segmento),
        legacyUnitCode: text(x.curappa_unidade), status: active(x.curappa_status) };
      const m = await this.mapped(entity, id);
      const course = m ? await this.prisma.course.update({ where: { id: m.newId }, data }) : await this.prisma.course.create({ data });
      await this.map(entity, id, course.id, x);
      return;
    }
    if (entity === 'groups') {
      const id = x.curso_id;
      const reference = nonzero(x.curso_id_curso) ? await this.mapped('courses', x.curso_id_curso) : null;
      if (nonzero(x.curso_id_curso) && !reference) throw new Error('Curso associado nao migrado');
      const data: any = { name: text(x.curso_nome) || `Turma ${id}`, code: String(id),
        type: text(x.curso_tipo_turma), courseId: reference?.newId || null, unit: text(x.curso_unidade),
        legacySegmentCode: text(x.curso_id_segmento), legacyProfileCode: text(x.curso_perfil_turma),
        status: active(x.curso_status) };
      const m = await this.mapped(entity, id);
      const group = m ? await this.prisma.classGroup.update({ where: { id: m.newId }, data }) : await this.prisma.classGroup.create({ data });
      await this.map(entity, id, group.id, x);
      return;
    }
    if (entity === 'disciplines') {
      const id = x.disc_id;
      const course = nonzero(x.disc_id_curso) ? await this.mapped('courses', x.disc_id_curso) : null;
      if (nonzero(x.disc_id_curso) && !course) throw new Error('Curso da disciplina nao migrado');
      const teacher = nonzero(x.disc_id_prof) ? await this.mapped('teachers', x.disc_id_prof) : null;
      const data: any = {
        courseId: course?.newId || null, teacherId: teacher?.newId || null,
        legacyProfessorReference: nonzero(x.disc_id_prof) ? String(x.disc_id_prof) : null,
        name: text(x.disc_disciplina) || `Disciplina ${id}`, phaseCode: text(x.disc_parte),
        moduleLabel: text(x.disc_mod_curso), workloadRaw: text(x.disc_ch),
        startDate: safeLegacyDate(x.disc_periodo_ini), endDate: safeLegacyDate(x.disc_periodo_fim),
        statusRaw: text(x.disc_status),
      };
      const mapped = await this.mapped(entity, id);
      const discipline = mapped
        ? await this.prisma.discipline.update({ where: { id: mapped.newId }, data })
        : await this.prisma.discipline.create({ data });
      await this.map(entity, id, discipline.id, x);
      return;
    }
    if (entity === 'disciplineTeachers') {
      const course = await this.mapped('courses', x.dvp_id_curso);
      const discipline = await this.mapped('disciplines', x.dvp_id_disc);
      const teacher = await this.mapped('teachers', x.dvp_id_prof);
      if (!course || !discipline || !teacher) throw new Error('Curso, disciplina ou facilitador ainda nao migrado');
      const link = await this.prisma.disciplineTeacher.upsert({
        where: { courseId_disciplineId_teacherId: {
          courseId: course.newId, disciplineId: discipline.newId, teacherId: teacher.newId,
        } },
        create: { courseId: course.newId, disciplineId: discipline.newId, teacherId: teacher.newId }, update: {},
      });
      await this.map(entity, x.dvp_id, link.id, x);
      return;
    }
    if (entity === 'courseHours') {
      const course = await this.mapped('courses', x.ch_id_curso);
      if (!course) throw new Error('Curso do horario nao migrado');
      const data: any = {
        courseId: course.newId, startTime: text(x.ch_horaI),
        endTime: text(x.ch_horaF), shift: text(x.ch_turno),
        startTime2: text(x.ch_horaI_2), endTime2: text(x.ch_horaF_2), shift2: text(x.ch_turno2),
        daysComboRaw: text(x.ch_dias1_combo), courseComboRaw: text(x.ch_curso1_combo),
        daysCombo2Raw: text(x.ch_dias2_combo), courseCombo2Raw: text(x.ch_curso2_combo),
        unitRaw: text(x.ch_unidade),
      };
      if (!data.startTime || !data.endTime || !data.shift) throw new Error('Horario incompleto no SISCAPRO');
      const mapped = await this.mapped(entity, x.ch_id);
      const hours = mapped
        ? await this.prisma.courseHours.update({ where: { id: mapped.newId }, data })
        : await this.prisma.courseHours.create({ data });
      await this.map(entity, x.ch_id, hours.id, x);
      return;
    }
    if (entity === 'teachingDays') {
      const course = await this.mapped('courses', x.cda_id_curso);
      const hours = await this.mapped('courseHours', x.cda_id_horario);
      if (!course || !hours) throw new Error('Curso ou horario do calendario nao migrado');
      const data: any = {
        courseId: course.newId, hoursId: hours.newId,
        monday: legacyBool(x.cda_dia_seg), tuesday: legacyBool(x.cda_dia_ter),
        wednesday: legacyBool(x.cda_dia_qua), thursday: legacyBool(x.cda_dia_qui),
        friday: legacyBool(x.cda_dia_sex), saturday: legacyBool(x.cda_dia_sab),
        partCode: text(x.cda_parteTP), unitRaw: text(x.cda_unidade),
      };
      const mapped = await this.mapped(entity, x.cda_id);
      const days = mapped
        ? await this.prisma.courseTeachingDays.update({ where: { id: mapped.newId }, data })
        : await this.prisma.courseTeachingDays.create({ data });
      await this.map(entity, x.cda_id, days.id, x);
      return;
    }
    if (entity === 'enrollments') {
      const person = await this.mapped('people', x.freq_id_aluno);
      const group = await this.mapped('groups', x.freq_id_turma);
      const course = nonzero(x.freq_id_curso) ? await this.mapped('courses', x.freq_id_curso) : null;
      const company = nonzero(x.freq_id_empresa) ? await this.mapped('companies', x.freq_id_empresa) : null;
      if (!person || !group || (nonzero(x.freq_id_curso) && !course) ||
          (nonzero(x.freq_id_empresa) && !company)) throw new Error('Vinculo de matricula depende de cadastro nao migrado');
      const data: any = {
        personId: person.newId, classGroupId: group.newId,
        courseId: course?.newId || null, companyId: company?.newId || null,
        // Never infer a valid contract from a numeric legacy reference.
        legacyContractReference: nonzero(x.freq_id_contrato) ? String(x.freq_id_contrato) : null,
        rosterStartDate: safeLegacyDate(x.freq_dt_listar_nome_ini),
        rosterEndDate: safeLegacyDate(x.freq_dt_listar_nome_fim),
        startDate: safeLegacyDate(x.freq_dt_inicio), endDate: safeLegacyDate(x.freq_dt_fim),
        returnDay: text(x.freq_dia_retorno),
      };
      const mapped = await this.mapped(entity, x.freq_id);
      // Imported roster rows are pending verification of cancellation/charging
      // conditions from contrato_aluno. Manual approvals survive later sync runs.
      const enrollment = mapped
        ? await this.prisma.enrollment.update({ where: { id: mapped.newId }, data })
        : await this.prisma.enrollment.create({ data: { ...data, status: 'PENDING' } });
      await this.map(entity, x.freq_id, enrollment.id, x);
      // Confirmed by 151/240 legacy groups: class groups can be shared by many courses.
      // Never overwrite ClassGroup.courseId from an enrollment.
      if (course) await this.prisma.classGroupCourse.upsert({
        where: { classGroupId_courseId: {classGroupId: group.newId, courseId: course.newId} },
        create: { classGroupId: group.newId, courseId: course.newId, evidence: 'LEGACY_ENROLLMENT' },
        update: {},
      });
      return;
    }
    if (entity === 'attendance') {
      const person = await this.mapped('people', x.freq_id_aluno);
      const group = await this.mapped('groups', x.freq_id_turma);
      if (!person || !group) throw new Error('Presenca depende de aluno e turma migrados');
      const date = safeLegacyDate(x.freq_data_aula);
      if (!date) throw new Error('Data da frequencia ausente');
      const code = text(x.freq_pf)?.toUpperCase() || '';
      // FJ is the legacy justified absence code; keep all other unknown raw codes.
      const justified = code === 'FJ' || ['1','S','SIM','TRUE'].includes(String(x.freq_justificada ?? '').toUpperCase());
      const data: any = {
        personId: person.newId, classGroupId: group.newId,
        classDate: date, sessionKey: `legacy-${x.freq_id}`,
        legacyCode: code, legacyDateReference: text(x.freq_id_data_aula),
        present: code === 'P', justified, reason: text(x.freq_motivo), attachment: text(x.freq_anexo),
      };
      const mapped = await this.mapped(entity, x.freq_id);
      const attendance = mapped
        ? await this.prisma.attendance.update({ where: { id: mapped.newId }, data })
        : await this.prisma.attendance.create({ data });
      await this.map(entity, x.freq_id, attendance.id, x);
      return;
    }
  }

  /** Busca apenas registros anteriormente reprovados. Nao recupera nem imprime PII. */
  private async failedRowsForRetry(table: string, batchId: string, after: string, take: number) {
    const pending = await this.prisma.legacyImportRecordResult.findMany({
      where: { batchId, sourceTable: table, status: 'FAILED', sourceKey: { gt: after } },
      select: { sourceKey: true },
      orderBy: { sourceKey: 'asc' }, take,
    });
    if (!pending.length) return [];
    const sources = await this.prisma.legacyRawRow.findMany({
      where: { batchId, sourceTable: table, sourceKey: { in: pending.map(x => x.sourceKey) } },
    });
    const byKey = new Map(sources.map(x => [x.sourceKey, x]));
    return pending.map(x => byKey.get(x.sourceKey))
      .filter((x): x is (typeof sources)[number] => x !== undefined);
  }

  /** Explicit, dependency-ordered promotion from ANONYMIZED staging only.
   * Never imports user credentials, PDFs or arbitrary tables. Source mapping is idempotent.
   */
  async promoteFromStaging(entity: string, after: string, take: number, batchId?: string, retryFailedOnly = false, deferSummary = false) {
    const safe: Record<string,string> = {
      people:'alunos',companies:'empresas',courses:'curso_appa',groups:'curso',
      disciplines:'disciplinas',enrollments:'montar_turma',attendance:'frequencia_master',
    };
    const table=safe[entity];
    if (!table) throw new BadRequestException('Entidade ainda sem transformador homologavel');
    if (!Number.isInteger(take) || take < 1 || take > 100 || after.length > 150) throw new BadRequestException('Lote ou cursor invalido');
    const rows = retryFailedOnly && batchId
      ? await this.failedRowsForRetry(table, batchId, after, take)
      : await this.prisma.legacyRawRow.findMany({where:{sourceTable:table,sourceKey:{gt:after},...(batchId?{batchId}:{})},orderBy:{sourceKey:'asc'},take});
    let written=0,errors=0;const failures:string[]=[];
    for(const row of rows){
      try {
        const existed=await this.prisma.legacyMapping.findUnique({where:{source_entity_legacyId:{source:'siscapro',entity,legacyId:row.sourceKey}}});
        if(batchId && existed){
          // Original data may be older than changes made locally. Never overwrite those records.
          const recorded=await this.prisma.legacyImportRecordResult.findUnique({where:{batchId_sourceTable_sourceKey:{batchId,sourceTable:table,sourceKey:row.sourceKey}}});
          if(!recorded || recorded.status==='FAILED')await this.prisma.legacyImportRecordResult.upsert({
            where:{batchId_sourceTable_sourceKey:{batchId,sourceTable:table,sourceKey:row.sourceKey}},
            create:{batchId,sourceTable:table,sourceKey:row.sourceKey,targetEntity:entity,targetId:existed.newId,status:'SKIPPED_EXISTING',reasonCode:'PREVIOUS_MAPPING',explanation:'Registro ja possuia correspondencia. Nenhuma alteracao atual foi sobrescrita.'},
            update:{targetId:existed.newId,status:'SKIPPED_EXISTING',reasonCode:'PREVIOUS_MAPPING',explanation:'Registro ja possuia correspondencia. Nenhuma alteracao atual foi sobrescrita.'},
          });
          continue;
        }
        await this.write(entity,row.rowData);
        written++;
        if(batchId){
          const mapped=await this.prisma.legacyMapping.findUnique({where:{source_entity_legacyId:{source:'siscapro',entity,legacyId:row.sourceKey}}});
          await this.prisma.legacyImportRecordResult.upsert({
            where:{batchId_sourceTable_sourceKey:{batchId,sourceTable:table,sourceKey:row.sourceKey}},
            create:{batchId,sourceTable:table,sourceKey:row.sourceKey,targetEntity:entity,targetId:mapped?.newId||null,status:existed?'UPDATED':'INSERTED'},
            update:{status:existed?'UPDATED':'INSERTED',targetId:mapped?.newId||null,reasonCode:null,explanation:null,processedAt:new Date()},
          });
        }
      } catch (error) {
        errors++;
        if(failures.length<20) failures.push(row.sourceKey);
        if(batchId){
          const { reason, explanation } = classifyPromotionFailure(error);
          await this.prisma.legacyImportRecordResult.upsert({
            where:{batchId_sourceTable_sourceKey:{batchId,sourceTable:table,sourceKey:row.sourceKey}},
            create:{batchId,sourceTable:table,sourceKey:row.sourceKey,targetEntity:entity,status:'FAILED',reasonCode:reason,explanation},
            update:{status:'FAILED',targetId:null,reasonCode:reason,explanation,processedAt:new Date()},
          });
        }
        // Failures must not disappear. Preserve the source row and audit the unresolved reference.
        // O lote ja registra a pendencia em LegacyImportRecordResult: nao gerar
        // quase 1 milhao de issues redundantes a cada tentativa.
        if (!batchId) await this.prisma.legacySyncIssue.create({data:{
          sourceTable:table,legacyRecordId:row.sourceKey,errorCode:'STAGING_PROMOTION_ERROR',
          description:'Importacao preservada no staging; verificar dependencia, cardinalidade, dados ou chave no legado.',
        }});
      }
    }
    if(batchId && !deferSummary){
      const counts=await this.prisma.legacyImportRecordResult.groupBy({by:['status'],where:{batchId,sourceTable:table},_count:{_all:true}});
      const converted=counts.filter(x=>['INSERTED','UPDATED'].includes(x.status)).reduce((n,x)=>n+x._count._all,0);
      const failed=counts.filter(x=>x.status==='FAILED').reduce((n,x)=>n+x._count._all,0);
      const skipped=counts.filter(x=>x.status==='SKIPPED_EXISTING').reduce((n,x)=>n+x._count._all,0);
      const tableState=await this.prisma.legacyImportTableStatus.findUnique({where:{batchId_sourceTable:{batchId,sourceTable:table}}});
      if(tableState){
        await this.prisma.legacyImportTableStatus.update({where:{id:tableState.id},data:{writtenCount:converted,skippedCount:skipped,failedCount:failed,
          status:converted+failed+skipped>=tableState.recordCount?(failed?'COMPLETED_WITH_ERRORS':'TRANSFORMED'):'TRANSFORMING',
          reason:failed?'Parte dos registros possui dependencias ou dados inconsistentes. Consulte detalhes por chave.':null,
          reasonCode:failed?'TRANSFORMATION_PARTIAL':null}});
      }
    }
    return {entity,sourceTable:table,read:rows.length,written,errors,failedKeys:failures,
      nextCursor:rows.length?rows[rows.length-1].sourceKey:after,hasMore:rows.length===take,
      warning:'Promocao controlada, sem certificacao de paridade completa. Vinculos orfaos mantidos no staging.'};
  }

  async sync(entity: string, after = 0) {
    if (['users','teachers','teacherAssignments'].includes(entity)) throw new BadRequestException('Sincronizacao de contas e facilitadores legados esta bloqueada por seguranca.');
    const config = QUERIES[entity];
    if (!config) throw new BadRequestException('Sincronizacao autorizada apenas para tabelas mapeadas e homologadas para leitura.');
    if (!Number.isSafeInteger(after) || after < 0) throw new BadRequestException('Cursor de sincronizacao invalido');
    const limitRaw = Number(process.env.LEGACY_SYNC_BATCH_SIZE || 500);
    const batch = Number.isFinite(limitRaw) ? Math.max(1, Math.min(Math.floor(limitRaw), 2000)) : 500;
    const run = await this.prisma.syncRun.create({ data: { source: SOURCE, entity, mode: 'MANUAL_CURSOR', status: 'RUNNING' } });
    let read = 0, written = 0, errors = 0, lastId = after;
    const failedIds: number[] = [];
    try {
      // Table and key only originate from static audited allowlist, never from request input.
      const sql = `SELECT * FROM \`${config.table}\` WHERE \`${config.key}\` > ? ORDER BY \`${config.key}\` LIMIT ?`;
      const [rows]: any = await this.db().query(sql, [after, batch]);
      read = rows.length;
      for (const row of rows) {
        lastId = Number(row[config.key]);
        try { await this.write(entity, row); written++; }
        catch { errors++; if (failedIds.length < 20) failedIds.push(lastId); }
      }
      const hasMore = rows.length === batch;
      await this.prisma.syncRun.update({ where: { id: run.id }, data: {
        status: errors ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED', finishedAt: new Date(), readCount: read,
        writeCount: written, errorCount: errors, message: `after=${after};last=${lastId};hasMore=${hasMore};failedIds=${failedIds.join(',')}`,
      } });
      return { runId: run.id, entity, read, written, errors, failedIds, after, nextCursor: lastId, hasMore };
    } catch (error: any) {
      await this.prisma.syncRun.update({ where: { id: run.id }, data: {
        status: 'FAILED', finishedAt: new Date(), readCount: read, writeCount: written,
        errorCount: errors + 1, message: String(error?.message || 'Erro desconhecido').slice(0, 500),
      } });
      throw error;
    }
  }
}

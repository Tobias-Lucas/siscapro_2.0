import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';
import { PERMISSION_CODES, requestPermission } from './permissions.js';

export type AccessScope = 'GLOBAL' | 'UNIT' | 'DEPARTMENT' | 'COMPANY' | 'OWN';
export type AccessDecision = { allowed: boolean; scope: AccessScope; allowedFields: string[] | null; code: string };
const isScope = (value: string): value is AccessScope => ['GLOBAL','UNIT','DEPARTMENT','COMPANY','OWN'].includes(value);
const extractFields = (data: unknown): string[] | null =>
  data === null || data === undefined ? null : Array.isArray(data) && data.every(x => typeof x === 'string') ? data : [];
const scopedDemandPath = (url: string) => {
  const parts = url.split('?')[0].split('/').filter(Boolean);
  return parts[0] === 'api' && parts[1] === 'demands' && !['types', 'reports'].includes(parts[2] || '');
};

@Injectable()
export class AccessService {
  constructor(private readonly db: PrismaService) {}

  async evaluate(userId: string, role: string, accessMode: string, code: string): Promise<AccessDecision> {
    if (role === 'SUPER_ADMIN' || accessMode !== 'CUSTOM') return { allowed: true, scope: 'GLOBAL', allowedFields: null, code };
    if (!PERMISSION_CODES.has(code)) return { allowed: false, scope: 'GLOBAL', allowedFields: null, code };
    const user = await this.db.user.findUnique({ where: { id: userId }, select: {
      accessTemplateId: true, accessTemplateVersion: true,
      accessTemplate: { select: { active: true, version: true } },
      accessOverrides: { where: { code } },
    } });
    if (!user) return { allowed: false, scope: 'GLOBAL', allowedFields: null, code };
    const exception = user.accessOverrides[0];
    if (exception) {
      const scope = isScope(exception.scope) ? exception.scope : 'GLOBAL';
      return { allowed: exception.allowed, scope, allowedFields: extractFields(exception.allowedFields), code };
    }
    if (!user.accessTemplateId || !user.accessTemplate?.active) return { allowed: false, scope: 'GLOBAL', allowedFields: null, code };
    const version = user.accessTemplateVersion ?? user.accessTemplate.version;
    const revision = await this.db.accessTemplateRevision.findUnique({
      where: { templateId_version: { templateId: user.accessTemplateId, version } },
      select: { grants: { where: { code }, select: { scope: true, allowedFields: true } } },
    });
    const grant = revision?.grants[0];
    if (!grant) return { allowed: false, scope: 'GLOBAL', allowedFields: null, code };
    const scope = isScope(grant.scope) ? grant.scope : 'GLOBAL';
    return { allowed: true, scope, allowedFields: extractFields(grant.allowedFields), code };
  }

  async forRequest(user: { sub: string; role: string; accessMode: string }, method: string, url: string, body: unknown): Promise<AccessDecision | null> {
    const code = requestPermission(method, url);
    const internal = new Set(['SUPER_ADMIN','ADMIN','SECRETARY','FINANCE','TRIAGE','CONTRACTS','SOCIAL_SERVICE','RECEPTION','COMMERCIAL','HR']);
    if (user.accessMode === 'CUSTOM' && !internal.has(user.role) && code !== 'SELF' && code !== 'PORTAL') {
      throw new ForbiddenException('Perfis externos nao acessam modulos internos');
    }
    if (code === 'SELF' || code === 'PORTAL') return null;
    if (user.accessMode !== 'CUSTOM' || user.role === 'SUPER_ADMIN') return null;
    if (code === 'REPORT_CATALOG') {
      const groups = ['relatorios.academicos.visualizar','relatorios.financeiros.visualizar','relatorios.contratuais.visualizar','relatorios.gerenciais.visualizar','integracao.auditoria.visualizar'];
      const decisions = await Promise.all(groups.map(item => this.evaluate(user.sub,user.role,user.accessMode,item)));
      if (decisions.some(x => x.allowed && x.scope === 'GLOBAL')) return { allowed:true, scope:'GLOBAL',allowedFields:null,code };
      throw new ForbiddenException('Nenhum relatorio autorizado');
    }
    if (!code) throw new ForbiddenException('Recurso sem politica de autorizacao cadastrada');
    const decision = await this.evaluate(user.sub,user.role,user.accessMode,code);
    if (!decision.allowed) throw new ForbiddenException(`Acesso nao autorizado: ${code}`);
    // UNIT/OWN are enabled only on endpoints that apply matching SQL-level filters.
    if (decision.scope !== 'GLOBAL' && !scopedDemandPath(url)) {
      throw new ForbiddenException('Este recurso ainda nao possui filtro de escopo de dados. Nenhum dado foi exposto.');
    }
    if (decision.allowedFields && ['POST','PUT','PATCH'].includes(method) && body && typeof body === 'object' && !Array.isArray(body)) {
      const keys = Object.keys(body);
      if (keys.some(key => !decision.allowedFields!.includes(key))) throw new ForbiddenException('Campo nao autorizado para alteracao');
    }
    if (url.includes('/reports/people/export')) {
      const sensitive = await this.evaluate(user.sub, user.role, user.accessMode, 'alunos.dados_sensiveis.visualizar');
      if (!sensitive.allowed) throw new ForbiddenException('Exportacao de dados pessoais depende de permissao adicional');
    }
    return decision;
  }
}

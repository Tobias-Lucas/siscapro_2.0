import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator.js';
import { AuthGuard } from '../common/auth.guard.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { PERMISSIONS, PERMISSION_CODES } from './permissions.js';

const validCode = (code: string) => PERMISSION_CODES.has(code);
const supportsScopedGrant = (code:string) => code.startsWith('empresas.demandas.tarefas.') || ['empresas.demandas.listar','empresas.demandas.visualizar','empresas.demandas.criar','empresas.demandas.editar','empresas.demandas.concluir','empresas.demandas.cancelar'].includes(code);
type CheckedGrant = { code: string; scope: string; allowedFields: string[] | null };
function checkedGrants(value: any): CheckedGrant[] {
  if (!Array.isArray(value) || value.length > 700) throw new BadRequestException('Permissoes invalidas');
  const used = new Set<string>();
  return value.map((entry: any) => {
    const code = String(entry.code || '');
    if (!validCode(code) || used.has(code)) throw new BadRequestException('Permissao desconhecida ou duplicada');
    used.add(code);
    const scope = String(entry.scope || 'GLOBAL');
    if (!['GLOBAL','UNIT','DEPARTMENT','COMPANY','OWN'].includes(scope)) throw new BadRequestException('Escopo invalido');
    if (scope !== 'GLOBAL' && !supportsScopedGrant(code)) throw new BadRequestException('Escopos restritos estao disponiveis somente para Demandas nesta versao; os demais recursos permanecem globais ou negados.');
    const fields = entry.allowedFields ?? null;
    if (fields !== null && (!Array.isArray(fields) || fields.some((x: unknown) => typeof x !== 'string' || !/^[a-zA-Z0-9_]{1,100}$/.test(x as string)))) throw new BadRequestException('Campos invalidos');
    return { code, scope, allowedFields: fields };
  });
}
const manageable = (u: any) => ['SUPER_ADMIN','ADMIN'].includes(u.role);
const grantData = (grants: CheckedGrant[]) => grants.map(g => ({ code:g.code, scope:g.scope, allowedFields:g.allowedFields ?? undefined }));

@Controller('iam') @UseGuards(AuthGuard)
export class AccessController {
  constructor(private readonly db: PrismaService, private readonly audit: AuditService) {}

  @Get('catalog') catalog(@CurrentUser() user:any) {
    if (!manageable(user)) throw new ForbiddenException();
    return PERMISSIONS;
  }
  @Get('me') async me(@CurrentUser() user:any) {
    if (user.role === 'SUPER_ADMIN') return { mode: 'SUPER_ADMIN', codes: PERMISSIONS.map(x => x.code), grants: PERMISSIONS.map(x=>({code:x.code,scope:'GLOBAL'})) };
    const row = await this.db.user.findUnique({ where: { id: user.sub }, select: {
      role:true, accessMode:true, accessTemplateId:true, accessTemplateVersion:true,
      accessTemplate:{select:{active:true,version:true}}, accessOverrides:true,
    } });
    if (!row) throw new ForbiddenException();
    if (row.accessMode !== 'CUSTOM') return { mode: 'LEGACY', role: row.role };
    const version = row.accessTemplateVersion ?? row.accessTemplate?.version;
    const revision = row.accessTemplateId && row.accessTemplate?.active && version
      ? await this.db.accessTemplateRevision.findUnique({where:{templateId_version:{templateId:row.accessTemplateId,version}},include:{grants:true}})
      : null;
    const effective = new Map<string,{code:string;scope:string;allowedFields:string[]|null}>();
    for (const grant of revision?.grants || []) {
      if(grant.scope!=='GLOBAL'&&!supportsScopedGrant(grant.code))continue;
      effective.set(grant.code,{code:grant.code,scope:grant.scope,allowedFields:Array.isArray(grant.allowedFields)?grant.allowedFields as string[]:null});
    }
    for (const override of row.accessOverrides) {
      if (override.allowed) { if(override.scope!=='GLOBAL'&&!supportsScopedGrant(override.code))continue; effective.set(override.code,{code:override.code,scope:override.scope,allowedFields:Array.isArray(override.allowedFields)?override.allowedFields as string[]:null}); }
      else effective.delete(override.code);
    }
    return { mode: 'CUSTOM', role: row.role, codes: [...effective.keys()], grants:[...effective.values()] };
  }
  @Get('templates') async templates(@CurrentUser() user:any) {
    if (!manageable(user)) throw new ForbiddenException();
    return this.db.accessTemplate.findMany({ include:{grants:true,revisions:{select:{version:true,createdAt:true,createdById:true},orderBy:{version:'desc'},take:10},_count:{select:{users:true}}}, orderBy:{name:'asc'},take:300 });
  }
  @Post('templates') async createTemplate(@CurrentUser() user:any, @Body() body:any) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Somente superadministrador define templates');
    const code = String(body?.code||'').trim().toLowerCase(), name = String(body?.name||'').trim();
    if (!/^[a-z0-9_-]{3,50}$/.test(code) || name.length<3 || name.length>100) throw new BadRequestException('Codigo ou nome invalido');
    const grants = checkedGrants(body?.grants||[]);
    const row = await this.db.$transaction(async tx => {
      const template = await tx.accessTemplate.create({data:{code,name,description:String(body?.description||'').slice(0,500),grants:{create:grantData(grants)}} ,include:{grants:true}});
      await tx.accessTemplateRevision.create({data:{templateId:template.id,version:template.version,createdById:user.sub,grants:{create:grantData(grants)}}});
      return template;
    });
    await this.audit.log({userId:user.sub,action:'CREATE_ACCESS_TEMPLATE',entity:'AccessTemplate',entityId:row.id,metadata:{version:1,grantCount:grants.length}});
    return row;
  }
  @Patch('templates/:id') async editTemplate(@CurrentUser() user:any,@Param('id') id:string,@Body() body:any){
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Somente superadministrador modifica templates');
    const old = await this.db.accessTemplate.findUniqueOrThrow({where:{id}});
    const grantsChanged = body.grants !== undefined;
    if (grantsChanged && typeof body.applyToExisting !== 'boolean') throw new BadRequestException('Informe explicitamente se a nova versao sera aplicada aos usuarios atuais');
    const grants = grantsChanged ? checkedGrants(body.grants) : undefined;
    const name = body.name === undefined ? old.name : String(body.name).trim();
    if (name.length<3 || name.length>100 || (body.active!==undefined && typeof body.active!=='boolean')) throw new BadRequestException('Dados invalidos');
    const newVersion = grantsChanged ? old.version + 1 : old.version;
    const row = await this.db.$transaction(async tx => {
      if(grantsChanged){
        await tx.accessGrant.deleteMany({where:{templateId:id}});
        if(grants!.length) await tx.accessGrant.createMany({data:grants!.map(g=>({templateId:id,...g,allowedFields:g.allowedFields??undefined}))});
      }
      const updated = await tx.accessTemplate.update({where:{id},data:{name,description:body.description===undefined?old.description:String(body.description).slice(0,500),active:body.active??old.active,...(grantsChanged?{version:newVersion}:{})},include:{grants:true}});
      if(grantsChanged){
        await tx.accessTemplateRevision.create({data:{templateId:id,version:newVersion,createdById:user.sub,changeNote:body.applyToExisting?'Aplicada aos usuarios vinculados':'Disponivel apenas para novos usuarios',grants:{create:grantData(grants!)}}});
        if(body.applyToExisting) await tx.user.updateMany({where:{accessTemplateId:id},data:{accessTemplateVersion:newVersion}});
      }
      return updated;
    });
    await this.audit.log({userId:user.sub,action:'UPDATE_ACCESS_TEMPLATE',entity:'AccessTemplate',entityId:id,metadata:{fromVersion:old.version,toVersion:row.version,grantsChanged,applyToExisting:grantsChanged?body.applyToExisting:null}});
    return row;
  }
  @Get('overrides/:id') async getOverrides(@CurrentUser() user:any,@Param('id') id:string){
    if (!manageable(user)) throw new ForbiddenException();
    return this.db.accessOverride.findMany({where:{userId:id}});
  }
  @Post('overrides/:id') async setOverrides(@CurrentUser() user:any,@Param('id') id:string,@Body() body:any){
    if (user.role!=='SUPER_ADMIN') throw new ForbiddenException('Somente superadministrador atribui excecoes');
    if (id === user.sub) throw new ForbiddenException('Nao e permitido modificar as proprias permissoes');
    const target=await this.db.user.findUniqueOrThrow({where:{id}});
    if(target.role==='SUPER_ADMIN')throw new ForbiddenException('Conta superadministradora nao aceita excecoes');
    const overrides=checkedGrants(body?.overrides||[]);
    const denied = new Set<string>((body?.denied||[]) as string[]);
    if ([...denied].some(c=>!validCode(c))) throw new BadRequestException('Negacao invalida');
    if (overrides.some(x=>denied.has(x.code))) throw new BadRequestException('Permissao negada e concedida simultaneamente');
    const result = await this.db.$transaction(async tx => {
      await tx.accessOverride.deleteMany({where:{userId:id}});
      const data=[...overrides.map(x=>({userId:id,code:x.code,allowed:true,scope:x.scope,allowedFields:x.allowedFields??undefined})),...[...denied].map(code=>({userId:id,code,allowed:false,scope:'GLOBAL'}))];
      if(data.length)await tx.accessOverride.createMany({data});
      return tx.user.update({where:{id},data:{accessMode:'CUSTOM'},select:{id:true,accessMode:true}});
    });
    await this.audit.log({userId:user.sub,action:'UPDATE_USER_PERMISSIONS',entity:'User',entityId:id,metadata:{count:overrides.length,denied:denied.size}});
    return result;
  }
}

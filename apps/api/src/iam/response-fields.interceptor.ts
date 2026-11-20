import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map, from, switchMap } from 'rxjs';
import { AccessService } from './access.service.js';

const privateNames = new Set([
 'cpf','rg','birthDate','guardianCpf','guardianEmail','email','phone','secondaryPhone',
 'zipCode','address','addressNumber','addressExtra','district','motherName','fatherName',
 'legalGuardian','financeEmail','bankRef',
]);
const privateLabels = new Set(['CPF','RG','Data de nascimento','E-mail','Telefone','Telefone adicional',
 'CEP','Logradouro','Endereço','Número','Complemento','Bairro','Nome da mãe','Nome do pai',
 'Responsável legal','CPF do responsável','E-mail do responsável','E-mail financeiro']);
const harmless = new Set(['id','status','createdAt','updatedAt','legacyId']);
function redact(value: unknown, depth = 0): unknown {
 if(depth>7 || value==null || typeof value!=='object')return value;
 if(Array.isArray(value))return value.map(row=>redact(row,depth+1));
 const input=value as Record<string,any>;const out:Record<string,any>={};
 for(const [key,part] of Object.entries(input)){
  if(privateNames.has(key)){out[key]=null;continue;}
  if(key==='value' && typeof input.label==='string' && privateLabels.has(input.label)){
   out[key]='Dado restrito';continue;
  }
  out[key]=redact(part,depth+1);
 }
 return out;
}
function trimFields(value:any,fields:string[]):any{
 const allowed=new Set([...fields,...harmless]);
 if(Array.isArray(value)) return value.map(x=>trimFields(x,fields));
 if(value&&typeof value==='object'){
  if(Array.isArray(value.items))return {...value,items:trimFields(value.items,fields)};
  return Object.fromEntries(Object.entries(value).filter(([key])=>allowed.has(key)));
 }
 return value;
}
@Injectable()
export class ResponseFieldsInterceptor implements NestInterceptor {
 constructor(private access:AccessService){}
 intercept(ctx:ExecutionContext,next:CallHandler):Observable<any>{
  const req=ctx.switchToHttp().getRequest();const user=req.user;
  if(!user||user.role==='SUPER_ADMIN'||user.accessMode!=='CUSTOM')return next.handle();
  const path=String(req.originalUrl||'');
  if(path.startsWith('/api/iam')||path.startsWith('/api/users')||path.startsWith('/api/auth')||path.startsWith('/api/portal'))return next.handle();
  return from(this.access.evaluate(user.sub,user.role,user.accessMode,'alunos.dados_sensiveis.visualizar')).pipe(
   switchMap(decision=>next.handle().pipe(map(response=>{
    let data=decision.allowed?response:redact(response);
    // Cross-module dossier sections lack independent row-scope policies: deny by omission.
    if(path.startsWith('/api/dossiers') && data && typeof data==='object') data={...data,sections:[]};
    if(req.accessDecision?.allowedFields)data=trimFields(data,req.accessDecision.allowedFields);
    return data;
   })))
  );
 }
}

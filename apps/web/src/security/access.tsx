import React, { createContext, useContext } from 'react';
export type AccessInfo = {mode:string;codes?:string[];role?:string};
const AccessContext = createContext<AccessInfo>({mode:'LEGACY'});
export const AccessProvider = AccessContext.Provider;
export const useAccess = () => {
 const info=useContext(AccessContext);
 const codes=new Set(info.codes||[]);
 return {...info,has:(code:string)=>(info.mode==='LEGACY'||info.mode==='SUPER_ADMIN')||codes.has(code), any:(prefix:string)=>(info.mode==='LEGACY'||info.mode==='SUPER_ADMIN')||[...codes].some(code=>code.startsWith(prefix))};
};
export function endpointPolicy(endpoint:string):string{
 const path=endpoint.split('/').filter(Boolean);
 const area=path[1],type=path[2];
 if(area==='operations')return `cadastros.${type}`;
 if(area==='people')return 'alunos.cadastro';
 if(area==='companies')return 'empresas.cadastro';
 if(area==='contracts')return 'contratos.instrumentos';
 if(area==='internships')return 'estagio.vinculos';
 if(area==='recruitment')return 'triagem.vagas';
 if(area==='finance')return 'financeiro.titulos';
 if(area==='service')return 'atendimento.requerimentos';
 if(area==='documents')return 'documentos.arquivos';
 if(area==='academic'){
  if(['teachers','teacher-assignments','discipline-teachers'].includes(type))return 'secretaria.facilitadores';
  if(type==='enrollments')return 'matriculas.vinculos';
  if(type==='attendance')return 'secretaria.frequencia';
  if(type==='grades')return 'secretaria.notas';
  if(type==='groups')return 'secretaria.turmas';
  return 'secretaria.cursos';
 }
 return 'cadastros.referencias';
}

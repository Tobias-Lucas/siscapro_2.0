import { BadRequestException } from '@nestjs/common';
export const parsePage=(page?:string,pageSize?:string)=>{
 const p=Number(page??1),n=Number(pageSize??25);
 if(!Number.isInteger(p)||p<1||p>1000000||!Number.isInteger(n)||n<1||n>100)throw new BadRequestException('Paginação inválida');
 return {page:p,pageSize:n,skip:(p-1)*n,take:n};
};
export const allowedStatus=(value:string|undefined,values:string[])=>{
 if(!value)return undefined;
 if(!values.includes(value))throw new BadRequestException('Situação inválida');
 return value;
};
export const compactQuery=(q?:string)=>String(q||'').trim().slice(0,140);

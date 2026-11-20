/** Catalogo de entidades E1 - lista fechada. Nao expor delegates arbitrarios do Prisma. */
export type CatalogField={key:string;type:string;optional:boolean;ref?:string|null;default?:string|null;label:string;multiline?:boolean;options?:string[]};
export type CatalogResource={model:string;modelKey:string;slug:string;label:string;group:string;roles:string[];fields:CatalogField[]};
import { CATALOG_INSTITUCIONAL } from './domains/institucional.js';
import { CATALOG_EMPRESAS } from './domains/empresas.js';
import { CATALOG_SECRETARIA } from './domains/secretaria.js';
import { CATALOG_CONTRATOS } from './domains/contratos.js';
import { CATALOG_ESTAGIO } from './domains/estagio.js';
import { CATALOG_FINANCEIRO } from './domains/financeiro.js';
import { CATALOG_ATENDIMENTO } from './domains/atendimento.js';
import { CATALOG_TRIAGEM } from './domains/triagem.js';
import { CATALOG_COMUNICACAO } from './domains/comunicacao.js';
import { CATALOG_DOCUMENTOS } from './domains/documentos.js';

export const CATALOG: CatalogResource[] = [
  ...CATALOG_INSTITUCIONAL,
  ...CATALOG_EMPRESAS,
  ...CATALOG_SECRETARIA,
  ...CATALOG_CONTRATOS,
  ...CATALOG_ESTAGIO,
  ...CATALOG_FINANCEIRO,
  ...CATALOG_ATENDIMENTO,
  ...CATALOG_TRIAGEM,
  ...CATALOG_COMUNICACAO,
  ...CATALOG_DOCUMENTOS
];

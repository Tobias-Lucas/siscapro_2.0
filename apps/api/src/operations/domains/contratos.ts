import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Contratos. Arquivo mantido isoladamente por modulo. */
export const CATALOG_CONTRATOS: CatalogResource[] = [
  {
    "model": "ContractAmendment",
    "slug": "contract-amendment",
    "fields": [
      {
        "key": "contractId",
        "type": "String",
        "optional": false,
        "ref": "Contract",
        "label": "Contrato"
      },
      {
        "key": "type",
        "type": "String",
        "optional": false,
        "label": "Tipo"
      },
      {
        "key": "effectiveAt",
        "type": "DateTime",
        "optional": false,
        "label": "Data de vigência"
      },
      {
        "key": "description",
        "type": "String",
        "optional": false,
        "label": "Descrição",
        "multiline": true
      },
      {
        "key": "documentId",
        "type": "String",
        "optional": true,
        "ref": "Document",
        "label": "Documento"
      },
      {
        "key": "status",
        "type": "RequestStatus",
        "optional": false,
        "default": "OPEN",
        "label": "Situação",
        "options": [
          "OPEN",
          "IN_PROGRESS",
          "WAITING",
          "DONE",
          "CANCELLED"
        ]
      }
    ],
    "label": "Aditivos contratuais",
    "group": "Contratos",
    "roles": [
      "CONTRACTS",
      "HR"
    ],
    "modelKey": "contractAmendment"
  },
  {
    "model": "ContractMovement",
    "slug": "contract-movement",
    "fields": [
      {
        "key": "contractId",
        "type": "String",
        "optional": false,
        "ref": "Contract",
        "label": "Contrato"
      },
      {
        "key": "actorId",
        "type": "String",
        "optional": true,
        "ref": "User",
        "label": "Usuário responsável"
      },
      {
        "key": "kind",
        "type": "String",
        "optional": false,
        "label": "Tipo"
      },
      {
        "key": "previousState",
        "type": "String",
        "optional": true,
        "label": "Situação anterior"
      },
      {
        "key": "newState",
        "type": "String",
        "optional": true,
        "label": "Nova situação"
      },
      {
        "key": "effectiveAt",
        "type": "DateTime",
        "optional": false,
        "label": "Data de vigência"
      },
      {
        "key": "reason",
        "type": "String",
        "optional": true,
        "label": "Motivo"
      }
    ],
    "label": "Movimentações contratuais",
    "group": "Contratos",
    "roles": [
      "CONTRACTS",
      "HR"
    ],
    "modelKey": "contractMovement"
  }
];

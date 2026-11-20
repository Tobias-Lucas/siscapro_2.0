import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Documentos. Arquivo mantido isoladamente por modulo. */
export const CATALOG_DOCUMENTOS: CatalogResource[] = [
  {
    "model": "DocumentTemplate",
    "slug": "document-template",
    "fields": [
      {
        "key": "name",
        "type": "String",
        "optional": false,
        "label": "Nome"
      },
      {
        "key": "type",
        "type": "String",
        "optional": false,
        "label": "Tipo"
      },
      {
        "key": "templateText",
        "type": "String",
        "optional": false,
        "label": "Modelo de texto",
        "multiline": true
      },
      {
        "key": "version",
        "type": "Int",
        "optional": false,
        "default": "1",
        "label": "Versão"
      },
      {
        "key": "status",
        "type": "RecordStatus",
        "optional": false,
        "default": "ACTIVE",
        "label": "Situação",
        "options": [
          "ACTIVE",
          "INACTIVE",
          "PENDING",
          "ARCHIVED"
        ]
      }
    ],
    "label": "Modelos de documentos",
    "group": "Documentos",
    "roles": [
      "SUPER_ADMIN",
      "ADMIN",
      "CONTRACTS"
    ],
    "modelKey": "documentTemplate"
  },
  {
    "model": "DocumentReview",
    "slug": "document-review",
    "fields": [
      {
        "key": "documentId",
        "type": "String",
        "optional": false,
        "ref": "Document",
        "label": "Documento"
      },
      {
        "key": "reviewerId",
        "type": "String",
        "optional": false,
        "ref": "User",
        "label": "Avaliador"
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
      },
      {
        "key": "note",
        "type": "String",
        "optional": true,
        "label": "Observação",
        "multiline": true
      },
      {
        "key": "reviewedAt",
        "type": "DateTime",
        "optional": true,
        "label": "Data da análise"
      }
    ],
    "label": "Análise documental",
    "group": "Documentos",
    "roles": [
      "SECRETARY",
      "CONTRACTS",
      "SOCIAL_SERVICE"
    ],
    "modelKey": "documentReview"
  }
];

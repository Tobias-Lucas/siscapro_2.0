import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Atendimento. Arquivo mantido isoladamente por modulo. */
export const CATALOG_ATENDIMENTO: CatalogResource[] = [
  {
    "model": "ServiceInteraction",
    "slug": "service-interaction",
    "fields": [
      {
        "key": "requestId",
        "type": "String",
        "optional": false,
        "ref": "ServiceRequest",
        "label": "Atendimento"
      },
      {
        "key": "authorId",
        "type": "String",
        "optional": false,
        "ref": "User",
        "label": "Responsável"
      },
      {
        "key": "body",
        "type": "String",
        "optional": false,
        "label": "Mensagem",
        "multiline": true
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
    "label": "Interações de atendimento",
    "group": "Atendimento",
    "roles": [
      "RECEPTION",
      "SECRETARY",
      "SOCIAL_SERVICE"
    ],
    "modelKey": "serviceInteraction"
  },
  {
    "model": "SocialVisit",
    "slug": "social-visit",
    "fields": [
      {
        "key": "personId",
        "type": "String",
        "optional": true,
        "ref": "Person",
        "label": "Aluno / pessoa"
      },
      {
        "key": "companyId",
        "type": "String",
        "optional": true,
        "ref": "Company",
        "label": "Empresa"
      },
      {
        "key": "authorId",
        "type": "String",
        "optional": false,
        "ref": "User",
        "label": "Responsável"
      },
      {
        "key": "visitDate",
        "type": "DateTime",
        "optional": false,
        "label": "Data da visita"
      },
      {
        "key": "summary",
        "type": "String",
        "optional": false,
        "label": "Resumo",
        "multiline": true
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
    "label": "Visitas e Serviço Social",
    "group": "Atendimento",
    "roles": [
      "SOCIAL_SERVICE"
    ],
    "modelKey": "socialVisit"
  }
];

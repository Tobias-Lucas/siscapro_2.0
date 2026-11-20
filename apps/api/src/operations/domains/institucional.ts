import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Institucional. Arquivo mantido isoladamente por modulo. */
export const CATALOG_INSTITUCIONAL: CatalogResource[] = [
  {
    "model": "Unit",
    "slug": "unit",
    "fields": [
      {
        "key": "code",
        "type": "String",
        "optional": false,
        "label": "Código"
      },
      {
        "key": "name",
        "type": "String",
        "optional": false,
        "label": "Nome"
      },
      {
        "key": "city",
        "type": "String",
        "optional": true,
        "label": "Cidade"
      },
      {
        "key": "state",
        "type": "String",
        "optional": true,
        "label": "UF"
      },
      {
        "key": "address",
        "type": "String",
        "optional": true,
        "label": "Endereço"
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
    "label": "Unidades",
    "group": "Institucional",
    "roles": [
      "SUPER_ADMIN",
      "ADMIN"
    ],
    "modelKey": "unit"
  },
  {
    "model": "Department",
    "slug": "department",
    "fields": [
      {
        "key": "code",
        "type": "String",
        "optional": false,
        "label": "Código"
      },
      {
        "key": "name",
        "type": "String",
        "optional": false,
        "label": "Nome"
      },
      {
        "key": "description",
        "type": "String",
        "optional": true,
        "label": "Descrição",
        "multiline": true
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
    "label": "Departamentos",
    "group": "Institucional",
    "roles": [
      "SUPER_ADMIN",
      "ADMIN"
    ],
    "modelKey": "department"
  },
  {
    "model": "UserUnit",
    "slug": "user-unit",
    "fields": [
      {
        "key": "userId",
        "type": "String",
        "optional": false,
        "ref": "User",
        "label": "Usuário"
      },
      {
        "key": "unitId",
        "type": "String",
        "optional": false,
        "ref": "Unit",
        "label": "Unidade"
      },
      {
        "key": "departmentId",
        "type": "String",
        "optional": true,
        "ref": "Department",
        "label": "Departamento"
      },
      {
        "key": "active",
        "type": "Boolean",
        "optional": false,
        "default": "true",
        "label": "Ativo"
      }
    ],
    "label": "Lotação de usuários",
    "group": "Institucional",
    "roles": [
      "SUPER_ADMIN",
      "ADMIN"
    ],
    "modelKey": "userUnit"
  },
  {
    "model": "ReferenceItem",
    "slug": "reference-item",
    "fields": [
      {
        "key": "domain",
        "type": "String",
        "optional": false,
        "label": "Domínio"
      },
      {
        "key": "code",
        "type": "String",
        "optional": false,
        "label": "Código"
      },
      {
        "key": "label",
        "type": "String",
        "optional": false,
        "label": "Descrição"
      },
      {
        "key": "sortOrder",
        "type": "Int",
        "optional": false,
        "default": "0",
        "label": "Ordem"
      },
      {
        "key": "active",
        "type": "Boolean",
        "optional": false,
        "default": "true",
        "label": "Ativo"
      }
    ],
    "label": "Tabelas de referência",
    "group": "Institucional",
    "roles": [
      "SUPER_ADMIN",
      "ADMIN"
    ],
    "modelKey": "referenceItem"
  },
  {
    "model": "Holiday",
    "slug": "holiday",
    "fields": [
      {
        "key": "unitId",
        "type": "String",
        "optional": true,
        "ref": "Unit",
        "label": "Unidade"
      },
      {
        "key": "holidayDate",
        "type": "DateTime",
        "optional": false,
        "label": "Data do feriado"
      },
      {
        "key": "name",
        "type": "String",
        "optional": false,
        "label": "Nome"
      },
      {
        "key": "scope",
        "type": "String",
        "optional": false,
        "default": "INSTITUTIONAL",
        "label": "Abrangência",
        "options": [
          "INSTITUTIONAL",
          "MUNICIPAL",
          "STATE",
          "NATIONAL"
        ]
      }
    ],
    "label": "Feriados",
    "group": "Institucional",
    "roles": [
      "SUPER_ADMIN",
      "ADMIN"
    ],
    "modelKey": "holiday"
  },
  {
    "model": "LegacySyncIssue",
    "slug": "legacy-sync-issue",
    "fields": [
      {
        "key": "sourceTable",
        "type": "String",
        "optional": false,
        "label": "Tabela de origem"
      },
      {
        "key": "legacyRecordId",
        "type": "String",
        "optional": false,
        "label": "ID no legado"
      },
      {
        "key": "errorCode",
        "type": "String",
        "optional": false,
        "label": "Código do erro"
      },
      {
        "key": "description",
        "type": "String",
        "optional": false,
        "label": "Descrição",
        "multiline": true
      },
      {
        "key": "resolvedAt",
        "type": "DateTime",
        "optional": true,
        "label": "Resolvido em"
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
    "label": "Pendências de migração",
    "group": "Institucional",
    "roles": [
      "SUPER_ADMIN"
    ],
    "modelKey": "legacySyncIssue"
  }
];

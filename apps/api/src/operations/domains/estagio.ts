import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Estágio. Arquivo mantido isoladamente por modulo. */
export const CATALOG_ESTAGIO: CatalogResource[] = [
  {
    "model": "Institution",
    "slug": "institution",
    "fields": [
      {
        "key": "name",
        "type": "String",
        "optional": false,
        "label": "Nome"
      },
      {
        "key": "cnpj",
        "type": "String",
        "optional": true,
        "label": "CNPJ"
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
        "key": "contactEmail",
        "type": "String",
        "optional": true,
        "label": "E-mail de contato"
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
    "label": "Instituições de ensino",
    "group": "Estágio",
    "roles": [
      "CONTRACTS",
      "SECRETARY"
    ],
    "modelKey": "institution"
  },
  {
    "model": "InstitutionCourse",
    "slug": "institution-course",
    "fields": [
      {
        "key": "institutionId",
        "type": "String",
        "optional": false,
        "ref": "Institution",
        "label": "Instituição"
      },
      {
        "key": "name",
        "type": "String",
        "optional": false,
        "label": "Nome"
      },
      {
        "key": "level",
        "type": "String",
        "optional": true,
        "label": "Nível"
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
    "label": "Cursos das instituições",
    "group": "Estágio",
    "roles": [
      "CONTRACTS",
      "SECRETARY"
    ],
    "modelKey": "institutionCourse"
  },
  {
    "model": "InternshipSupervisor",
    "slug": "internship-supervisor",
    "fields": [
      {
        "key": "companyId",
        "type": "String",
        "optional": false,
        "ref": "Company",
        "label": "Empresa"
      },
      {
        "key": "userId",
        "type": "String",
        "optional": true,
        "ref": "User",
        "label": "Usuário"
      },
      {
        "key": "fullName",
        "type": "String",
        "optional": false,
        "label": "Nome completo"
      },
      {
        "key": "email",
        "type": "String",
        "optional": true,
        "label": "E-mail"
      },
      {
        "key": "phone",
        "type": "String",
        "optional": true,
        "label": "Telefone"
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
    "label": "Supervisores de estágio",
    "group": "Estágio",
    "roles": [
      "CONTRACTS",
      "SECRETARY"
    ],
    "modelKey": "internshipSupervisor"
  },
  {
    "model": "InternshipReport",
    "slug": "internship-report",
    "fields": [
      {
        "key": "internshipId",
        "type": "String",
        "optional": false,
        "ref": "Internship",
        "label": "Estágio"
      },
      {
        "key": "supervisorId",
        "type": "String",
        "optional": true,
        "ref": "InternshipSupervisor",
        "label": "Supervisor"
      },
      {
        "key": "kind",
        "type": "String",
        "optional": false,
        "label": "Tipo",
        "options": [
          "RA",
          "TRE",
          "OTHER"
        ]
      },
      {
        "key": "periodStart",
        "type": "DateTime",
        "optional": false,
        "label": "Início do período"
      },
      {
        "key": "periodEnd",
        "type": "DateTime",
        "optional": false,
        "label": "Fim do período"
      },
      {
        "key": "content",
        "type": "String",
        "optional": false,
        "label": "Conteúdo",
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
    "label": "Relatórios RA / TRE",
    "group": "Estágio",
    "roles": [
      "CONTRACTS",
      "SECRETARY"
    ],
    "modelKey": "internshipReport"
  },
  {
    "model": "InternshipLeave",
    "slug": "internship-leave",
    "fields": [
      {
        "key": "internshipId",
        "type": "String",
        "optional": false,
        "ref": "Internship",
        "label": "Estágio"
      },
      {
        "key": "startDate",
        "type": "DateTime",
        "optional": false,
        "label": "Início"
      },
      {
        "key": "endDate",
        "type": "DateTime",
        "optional": false,
        "label": "Término"
      },
      {
        "key": "reason",
        "type": "String",
        "optional": true,
        "label": "Motivo"
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
    "label": "Recessos de estágio",
    "group": "Estágio",
    "roles": [
      "CONTRACTS",
      "SECRETARY"
    ],
    "modelKey": "internshipLeave"
  }
];

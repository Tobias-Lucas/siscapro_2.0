import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Empresas. Arquivo mantido isoladamente por modulo. */
export const CATALOG_EMPRESAS: CatalogResource[] = [
  {
    "model": "CompanyGroup",
    "slug": "company-group",
    "fields": [
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
    "label": "Grupos empresariais",
    "group": "Empresas",
    "roles": [
      "CONTRACTS",
      "FINANCE",
      "COMMERCIAL",
      "HR"
    ],
    "modelKey": "companyGroup"
  },
  {
    "model": "CompanyGroupMember",
    "slug": "company-group-member",
    "fields": [
      {
        "key": "groupId",
        "type": "String",
        "optional": false,
        "ref": "CompanyGroup",
        "label": "Grupo empresarial"
      },
      {
        "key": "companyId",
        "type": "String",
        "optional": false,
        "ref": "Company",
        "label": "Empresa"
      }
    ],
    "label": "Empresas por grupo",
    "group": "Empresas",
    "roles": [
      "CONTRACTS",
      "FINANCE",
      "COMMERCIAL",
      "HR"
    ],
    "modelKey": "companyGroupMember"
  },
  {
    "model": "CompanyContact",
    "slug": "company-contact",
    "fields": [
      {
        "key": "companyId",
        "type": "String",
        "optional": false,
        "ref": "Company",
        "label": "Empresa"
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
        "key": "category",
        "type": "String",
        "optional": false,
        "label": "Categoria"
      },
      {
        "key": "position",
        "type": "String",
        "optional": true,
        "label": "Função"
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
    "label": "Contatos das empresas",
    "group": "Empresas",
    "roles": [
      "CONTRACTS",
      "FINANCE",
      "COMMERCIAL",
      "HR"
    ],
    "modelKey": "companyContact"
  },
  {
    "model": "BusinessContract",
    "slug": "business-contract",
    "fields": [
      {
        "key": "companyId",
        "type": "String",
        "optional": false,
        "ref": "Company",
        "label": "Empresa"
      },
      {
        "key": "number",
        "type": "String",
        "optional": false,
        "label": "Número"
      },
      {
        "key": "modality",
        "type": "String",
        "optional": true,
        "label": "Modalidade"
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
        "optional": true,
        "label": "Término"
      },
      {
        "key": "amount",
        "type": "Decimal",
        "optional": true,
        "label": "Valor (R$)"
      },
      {
        "key": "status",
        "type": "ContractStatus",
        "optional": false,
        "default": "DRAFT",
        "label": "Situação",
        "options": [
          "DRAFT",
          "PENDING_SIGNATURE",
          "ACTIVE",
          "SUSPENDED",
          "TERMINATED",
          "CANCELLED"
        ]
      },
      {
        "key": "notes",
        "type": "String",
        "optional": true,
        "label": "Observações"
      }
    ],
    "label": "Contratos empresariais",
    "group": "Empresas",
    "roles": [
      "CONTRACTS",
      "FINANCE",
      "COMMERCIAL",
      "HR"
    ],
    "modelKey": "businessContract"
  }
];

import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Financeiro. Arquivo mantido isoladamente por modulo. */
export const CATALOG_FINANCEIRO: CatalogResource[] = [
  {
    "model": "FinanceAccount",
    "slug": "finance-account",
    "fields": [
      {
        "key": "name",
        "type": "String",
        "optional": false,
        "label": "Nome"
      },
      {
        "key": "bankName",
        "type": "String",
        "optional": true,
        "label": "Banco"
      },
      {
        "key": "agency",
        "type": "String",
        "optional": true,
        "label": "Agência"
      },
      {
        "key": "accountNumber",
        "type": "String",
        "optional": true,
        "label": "Conta"
      },
      {
        "key": "pixKey",
        "type": "String",
        "optional": true,
        "label": "Chave Pix"
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
    "label": "Contas bancárias",
    "group": "Financeiro",
    "roles": [
      "FINANCE"
    ],
    "modelKey": "financeAccount"
  },
  {
    "model": "FinanceCategory",
    "slug": "finance-category",
    "fields": [
      {
        "key": "name",
        "type": "String",
        "optional": false,
        "label": "Nome"
      },
      {
        "key": "kind",
        "type": "String",
        "optional": false,
        "label": "Tipo"
      },
      {
        "key": "active",
        "type": "Boolean",
        "optional": false,
        "default": "true",
        "label": "Ativo"
      }
    ],
    "label": "Categorias financeiras",
    "group": "Financeiro",
    "roles": [
      "FINANCE"
    ],
    "modelKey": "financeCategory"
  },
  {
    "model": "FinanceMovement",
    "slug": "finance-movement",
    "fields": [
      {
        "key": "accountId",
        "type": "String",
        "optional": false,
        "ref": "FinanceAccount",
        "label": "Conta"
      },
      {
        "key": "categoryId",
        "type": "String",
        "optional": true,
        "ref": "FinanceCategory",
        "label": "Categoria"
      },
      {
        "key": "direction",
        "type": "String",
        "optional": false,
        "label": "Entrada / saída",
        "options": [
          "IN",
          "OUT"
        ]
      },
      {
        "key": "description",
        "type": "String",
        "optional": false,
        "label": "Descrição",
        "multiline": true
      },
      {
        "key": "occurredAt",
        "type": "DateTime",
        "optional": false,
        "label": "Data do lançamento"
      },
      {
        "key": "amount",
        "type": "Decimal",
        "optional": false,
        "label": "Valor (R$)"
      },
      {
        "key": "externalReference",
        "type": "String",
        "optional": true,
        "label": "Referência externa"
      }
    ],
    "label": "Movimentações financeiras",
    "group": "Financeiro",
    "roles": [
      "FINANCE"
    ],
    "modelKey": "financeMovement"
  },
  {
    "model": "Invoice",
    "slug": "invoice",
    "fields": [
      {
        "key": "companyId",
        "type": "String",
        "optional": true,
        "ref": "Company",
        "label": "Empresa"
      },
      {
        "key": "reference",
        "type": "String",
        "optional": false,
        "label": "Referência"
      },
      {
        "key": "competence",
        "type": "String",
        "optional": true,
        "label": "Competência"
      },
      {
        "key": "dueDate",
        "type": "DateTime",
        "optional": true,
        "label": "Vencimento"
      },
      {
        "key": "issuedAt",
        "type": "DateTime",
        "optional": true,
        "label": "Emissão"
      },
      {
        "key": "amount",
        "type": "Decimal",
        "optional": false,
        "label": "Valor (R$)"
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
    "label": "Faturas",
    "group": "Financeiro",
    "roles": [
      "FINANCE"
    ],
    "modelKey": "invoice"
  },
  {
    "model": "InvoiceLine",
    "slug": "invoice-line",
    "fields": [
      {
        "key": "invoiceId",
        "type": "String",
        "optional": false,
        "ref": "Invoice",
        "label": "Fatura"
      },
      {
        "key": "description",
        "type": "String",
        "optional": false,
        "label": "Descrição",
        "multiline": true
      },
      {
        "key": "quantity",
        "type": "Decimal",
        "optional": false,
        "label": "Quantidade"
      },
      {
        "key": "unitPrice",
        "type": "Decimal",
        "optional": false,
        "label": "Valor unitário (R$)"
      },
      {
        "key": "amount",
        "type": "Decimal",
        "optional": false,
        "label": "Valor (R$)"
      }
    ],
    "label": "Itens de fatura",
    "group": "Financeiro",
    "roles": [
      "FINANCE"
    ],
    "modelKey": "invoiceLine"
  },
  {
    "model": "BillingAttachment",
    "slug": "billing-attachment",
    "fields": [
      {
        "key": "titleId",
        "type": "String",
        "optional": true,
        "ref": "FinancialTitle",
        "label": "Título financeiro"
      },
      {
        "key": "invoiceId",
        "type": "String",
        "optional": true,
        "ref": "Invoice",
        "label": "Fatura"
      },
      {
        "key": "documentId",
        "type": "String",
        "optional": false,
        "ref": "Document",
        "label": "Documento"
      },
      {
        "key": "kind",
        "type": "String",
        "optional": false,
        "label": "Tipo"
      }
    ],
    "label": "Documentos de cobrança",
    "group": "Financeiro",
    "roles": [
      "FINANCE"
    ],
    "modelKey": "billingAttachment"
  }
];

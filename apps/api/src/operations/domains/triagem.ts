import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Recrutamento. Arquivo mantido isoladamente por modulo. */
export const CATALOG_TRIAGEM: CatalogResource[] = [
  {
    "model": "SelectionProcess",
    "slug": "selection-process",
    "fields": [
      {
        "key": "title",
        "type": "String",
        "optional": false,
        "label": "Título"
      },
      {
        "key": "code",
        "type": "String",
        "optional": true,
        "label": "Código"
      },
      {
        "key": "startDate",
        "type": "DateTime",
        "optional": true,
        "label": "Início"
      },
      {
        "key": "endDate",
        "type": "DateTime",
        "optional": true,
        "label": "Término"
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
        "key": "description",
        "type": "String",
        "optional": true,
        "label": "Descrição",
        "multiline": true
      }
    ],
    "label": "Processos seletivos",
    "group": "Recrutamento",
    "roles": [
      "TRIAGE",
      "COMMERCIAL"
    ],
    "modelKey": "selectionProcess"
  },
  {
    "model": "SelectionEntry",
    "slug": "selection-entry",
    "fields": [
      {
        "key": "processId",
        "type": "String",
        "optional": false,
        "ref": "SelectionProcess",
        "label": "Processo seletivo"
      },
      {
        "key": "personId",
        "type": "String",
        "optional": false,
        "ref": "Person",
        "label": "Aluno / pessoa"
      },
      {
        "key": "score",
        "type": "Decimal",
        "optional": true,
        "label": "Nota"
      },
      {
        "key": "rank",
        "type": "Int",
        "optional": true,
        "label": "Classificação"
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
    "label": "Inscrições em processos",
    "group": "Recrutamento",
    "roles": [
      "TRIAGE",
      "COMMERCIAL"
    ],
    "modelKey": "selectionEntry"
  }
];

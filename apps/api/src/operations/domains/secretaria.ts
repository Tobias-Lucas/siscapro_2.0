import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Secretaria. Arquivo mantido isoladamente por modulo. */
export const CATALOG_SECRETARIA: CatalogResource[] = [
  {
    "model": "CurriculumMatrix",
    "slug": "curriculum-matrix",
    "fields": [
      {
        "key": "courseId",
        "type": "String",
        "optional": false,
        "ref": "Course",
        "label": "Curso"
      },
      {
        "key": "code",
        "type": "String",
        "optional": false,
        "label": "Código"
      },
      {
        "key": "version",
        "type": "String",
        "optional": false,
        "label": "Versão"
      },
      {
        "key": "title",
        "type": "String",
        "optional": false,
        "label": "Título"
      },
      {
        "key": "effectiveFrom",
        "type": "DateTime",
        "optional": true,
        "label": "Início da vigência"
      },
      {
        "key": "effectiveTo",
        "type": "DateTime",
        "optional": true,
        "label": "Fim da vigência"
      },
      {
        "key": "status",
        "type": "RecordStatus",
        "optional": false,
        "default": "ACTIVE",
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
    "label": "Matrizes curriculares",
    "group": "Secretaria",
    "roles": [
      "SECRETARY"
    ],
    "modelKey": "curriculumMatrix"
  },
  {
    "model": "CurriculumModule",
    "slug": "curriculum-module",
    "fields": [
      {
        "key": "matrixId",
        "type": "String",
        "optional": false,
        "ref": "CurriculumMatrix",
        "label": "Matriz curricular"
      },
      {
        "key": "disciplineId",
        "type": "String",
        "optional": true,
        "ref": "Discipline",
        "label": "Disciplina"
      },
      {
        "key": "title",
        "type": "String",
        "optional": false,
        "label": "Título"
      },
      {
        "key": "sequence",
        "type": "Int",
        "optional": false,
        "label": "Ordem"
      },
      {
        "key": "plannedHours",
        "type": "Int",
        "optional": true,
        "label": "Horas previstas"
      },
      {
        "key": "lessonCount",
        "type": "Int",
        "optional": true,
        "label": "Quantidade de aulas"
      },
      {
        "key": "mandatory",
        "type": "Boolean",
        "optional": false,
        "default": "true",
        "label": "Obrigatório"
      }
    ],
    "label": "Módulos da matriz",
    "group": "Secretaria",
    "roles": [
      "SECRETARY"
    ],
    "modelKey": "curriculumModule"
  },
  {
    "model": "AcademicLesson",
    "slug": "academic-lesson",
    "fields": [
      {
        "key": "classGroupId",
        "type": "String",
        "optional": false,
        "ref": "ClassGroup",
        "label": "Turma"
      },
      {
        "key": "disciplineId",
        "type": "String",
        "optional": true,
        "ref": "Discipline",
        "label": "Disciplina"
      },
      {
        "key": "teacherId",
        "type": "String",
        "optional": true,
        "ref": "User",
        "label": "Facilitador"
      },
      {
        "key": "title",
        "type": "String",
        "optional": false,
        "label": "Título"
      },
      {
        "key": "lessonDate",
        "type": "DateTime",
        "optional": false,
        "label": "Data da aula"
      },
      {
        "key": "shift",
        "type": "String",
        "optional": false,
        "label": "Turno"
      },
      {
        "key": "room",
        "type": "String",
        "optional": true,
        "label": "Sala"
      },
      {
        "key": "state",
        "type": "String",
        "optional": false,
        "default": "PLANNED",
        "label": "Situação da aula",
        "options": [
          "PLANNED",
          "DONE",
          "CANCELLED",
          "RESCHEDULED"
        ]
      },
      {
        "key": "executedAt",
        "type": "DateTime",
        "optional": true,
        "label": "Executed at"
      }
    ],
    "label": "Datas e aulas",
    "group": "Secretaria",
    "roles": [
      "SECRETARY"
    ],
    "modelKey": "academicLesson"
  },
  {
    "model": "LearningMaterial",
    "slug": "learning-material",
    "fields": [
      {
        "key": "courseId",
        "type": "String",
        "optional": false,
        "ref": "Course",
        "label": "Curso"
      },
      {
        "key": "disciplineId",
        "type": "String",
        "optional": true,
        "ref": "Discipline",
        "label": "Disciplina"
      },
      {
        "key": "documentId",
        "type": "String",
        "optional": true,
        "ref": "Document",
        "label": "Documento"
      },
      {
        "key": "title",
        "type": "String",
        "optional": false,
        "label": "Título"
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
    "label": "Materiais didáticos",
    "group": "Secretaria",
    "roles": [
      "SECRETARY"
    ],
    "modelKey": "learningMaterial"
  },
  {
    "model": "MaterialRelease",
    "slug": "material-release",
    "fields": [
      {
        "key": "materialId",
        "type": "String",
        "optional": false,
        "ref": "LearningMaterial",
        "label": "Material"
      },
      {
        "key": "personId",
        "type": "String",
        "optional": false,
        "ref": "Person",
        "label": "Aluno / pessoa"
      },
      {
        "key": "releasedAt",
        "type": "DateTime",
        "optional": false,
        "default": "now()",
        "label": "Liberado em"
      }
    ],
    "label": "Liberação de materiais",
    "group": "Secretaria",
    "roles": [
      "SECRETARY"
    ],
    "modelKey": "materialRelease"
  },
  {
    "model": "AbsenceJustification",
    "slug": "absence-justification",
    "fields": [
      {
        "key": "personId",
        "type": "String",
        "optional": false,
        "ref": "Person",
        "label": "Aluno / pessoa"
      },
      {
        "key": "attendanceId",
        "type": "String",
        "optional": true,
        "ref": "Attendance",
        "label": "Frequência"
      },
      {
        "key": "documentId",
        "type": "String",
        "optional": true,
        "ref": "Document",
        "label": "Documento"
      },
      {
        "key": "reason",
        "type": "String",
        "optional": false,
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
      },
      {
        "key": "reviewNotes",
        "type": "String",
        "optional": true,
        "label": "Observações de análise",
        "multiline": true
      }
    ],
    "label": "Justificativas de falta",
    "group": "Secretaria",
    "roles": [
      "SECRETARY"
    ],
    "modelKey": "absenceJustification"
  }
];

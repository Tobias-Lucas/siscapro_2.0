import type { CatalogResource } from '../catalog.js';
/** Cadastro operacional: Comunicação. Arquivo mantido isoladamente por modulo. */
export const CATALOG_COMUNICACAO: CatalogResource[] = [
  {
    "model": "PortalMessage",
    "slug": "portal-message",
    "fields": [
      {
        "key": "recipientId",
        "type": "String",
        "optional": false,
        "ref": "User",
        "label": "Destinatário"
      },
      {
        "key": "subject",
        "type": "String",
        "optional": false,
        "label": "Assunto"
      },
      {
        "key": "body",
        "type": "String",
        "optional": false,
        "label": "Mensagem",
        "multiline": true
      },
      {
        "key": "readAt",
        "type": "DateTime",
        "optional": true,
        "label": "Lido em"
      },
      {
        "key": "channel",
        "type": "String",
        "optional": false,
        "default": "IN_APP",
        "label": "Canal",
        "options": [
          "IN_APP",
          "EMAIL",
          "WHATSAPP"
        ]
      }
    ],
    "label": "Comunicações internas",
    "group": "Comunicação",
    "roles": [
      "SECRETARY",
      "CONTRACTS",
      "SOCIAL_SERVICE",
      "RECEPTION"
    ],
    "modelKey": "portalMessage"
  }
];

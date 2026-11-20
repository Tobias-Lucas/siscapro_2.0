import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma client generation and CI validation do not connect to a database.
// Migrations must run with a real DATABASE_URL supplied by the deployment.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL || 'postgresql://schema-only:schema-only@localhost:5432/schema-only' },
});

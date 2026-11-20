import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, PasswordAlgorithm } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.AITINET_ADMIN_EMAIL || 'admin@aitinet.local').toLowerCase();
  const password = process.env.AITINET_ADMIN_PASSWORD || 'ChangeThisNow!2026';
  const name = process.env.AITINET_ADMIN_NAME || 'Aitinet';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, login: 'aitinet', passwordHash, passwordAlgorithm: PasswordAlgorithm.ARGON2ID, role: UserRole.SUPER_ADMIN, active: true },
  });
}
main().finally(() => prisma.$disconnect());

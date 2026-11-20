import { Controller, Get } from '@nestjs/common'; import { PrismaService } from './common/prisma.service.js';
@Controller('health') export class HealthController { constructor(private prisma:PrismaService){} @Get() async health(){await this.prisma.$queryRaw`SELECT 1`;return {status:'ok',service:'proativa-api',time:new Date().toISOString(),legacyEnabled:process.env.LEGACY_ENABLED==='true'};} }

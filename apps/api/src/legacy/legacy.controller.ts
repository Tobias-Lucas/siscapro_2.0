import { BadRequestException, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { UserRole } from '../generated/prisma/client.js';
import { LegacyService } from './legacy.service.js';

@Controller('legacy')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class LegacyController {
  constructor(private legacy: LegacyService) {}
  @Get('status') status() { return this.legacy.status(); }
  @Get('tables') tables() { return this.legacy.tables(); }
  @Get('preview/:entity') preview(@Param('entity') entity: string, @Query('limit') limit?: string) { return this.legacy.preview(entity, Number(limit || 20)); }
  @Post('sync/:entity') sync(@Param('entity') entity: string, @Query('after') cursor = '0') {
    if (!/^\d+$/.test(cursor)) throw new BadRequestException('Cursor invalido');
    return this.legacy.sync(entity, Number(cursor));
  }
}

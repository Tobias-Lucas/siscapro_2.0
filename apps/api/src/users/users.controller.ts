import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import * as argon2 from 'argon2';
import { UserRole, PasswordAlgorithm } from '../generated/prisma/client.js';
import { AuthGuard } from '../common/auth.guard.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';

class UserDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() login?: string;
  @IsString() @MinLength(10) password!: string;
  @IsEnum(UserRole) role!: UserRole;
  @IsOptional() @IsString() personId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() accessTemplateId?: string;
}
class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() personId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() accessTemplateId?: string;
  @IsOptional() @IsString() accessMode?: string;
}
const PRIVILEGED = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class UsersController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}
  @Get()
  async list() {
    const rows = await this.prisma.user.findMany({ orderBy: { name: 'asc' }, take: 500 });
    return rows.map(({ passwordHash, passwordAlgorithm, ...user }) => user);
  }
  @Post()
  async create(@Body() dto: UserDto, @CurrentUser() actor: any) {
    if (actor.role !== UserRole.SUPER_ADMIN && PRIVILEGED.has(dto.role)) {
      throw new ForbiddenException('Somente superadministrador cria contas administrativas');
    }
    if (dto.accessTemplateId && actor.role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Somente superadministrador atribui templates');
    if (dto.role !== UserRole.SUPER_ADMIN && !dto.accessTemplateId) throw new BadRequestException('Selecione um template de acesso para a nova conta');
    if (dto.accessTemplateId) {
      const t = await this.prisma.accessTemplate.findUnique({where:{id:dto.accessTemplateId}});
      if (!t?.active) throw new ForbiddenException('Template inexistente ou inativo');
    }
    const row = await this.prisma.user.create({ data: {
      name: dto.name, email: dto.email.toLowerCase(), login: dto.login || undefined,
      passwordHash: await argon2.hash(dto.password, { type: argon2.argon2id }),
      passwordAlgorithm: PasswordAlgorithm.ARGON2ID, role: dto.role, active: true,
      personId: dto.personId || undefined, companyId: dto.companyId || undefined,
      accessTemplateId: dto.accessTemplateId || null, accessTemplateVersion: dto.accessTemplateId ? (await this.prisma.accessTemplate.findUniqueOrThrow({where:{id:dto.accessTemplateId},select:{version:true}})).version : null, accessMode: dto.accessTemplateId ? 'CUSTOM' : 'LEGACY',
    } });
    await this.audit.log({ userId: actor.sub, action: 'CREATE', entity: 'User', entityId: row.id });
    const { passwordHash, passwordAlgorithm, ...safe } = row;
    return safe;
  }
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: any) {
    const target = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    if (actor.role !== UserRole.SUPER_ADMIN && (PRIVILEGED.has(target.role) || dto.role !== undefined || dto.active !== undefined)) {
      throw new ForbiddenException('Somente superadministrador altera perfis e ativacao de contas');
    }
    if (id === actor.sub && (dto.active === false || (dto.role && dto.role !== UserRole.SUPER_ADMIN))) {
      throw new ForbiddenException('Nao e permitido remover o proprio acesso privilegiado');
    }
    if (dto.accessMode !== undefined && !['LEGACY','CUSTOM'].includes(dto.accessMode)) throw new ForbiddenException('Modo de acesso invalido');
    const selectedTemplate = dto.accessTemplateId ? await this.prisma.accessTemplate.findUnique({where:{id:dto.accessTemplateId}}) : null;
    if (dto.accessTemplateId && !selectedTemplate?.active) throw new ForbiddenException('Template inexistente ou inativo');
    if (actor.role !== UserRole.SUPER_ADMIN && (dto.accessMode !== undefined || dto.accessTemplateId !== undefined)) throw new ForbiddenException('Somente superadministrador altera o controle granular');
    const removesLastSuperAdmin = target.role === UserRole.SUPER_ADMIN && target.active &&
      ((dto.active === false) || (dto.role !== undefined && dto.role !== UserRole.SUPER_ADMIN));
    const { accessTemplateId, accessMode, ...other } = dto;
    const data = { ...other,
      ...(accessTemplateId !== undefined ? {accessTemplateId: accessTemplateId || null, accessTemplateVersion: accessTemplateId ? selectedTemplate!.version : null, accessMode: accessTemplateId ? 'CUSTOM' : 'LEGACY'} : {}),
      ...(accessMode !== undefined ? {accessMode} : {}),
    };
    const row = await this.prisma.$transaction(async tx => {
      if (removesLastSuperAdmin) {
        const activeAdmins = await tx.user.count({where:{role:UserRole.SUPER_ADMIN,active:true}});
        if (activeAdmins <= 1) throw new ForbiddenException('A ultima conta Super Admin ativa nao pode ser desativada ou rebaixada');
      }
      return tx.user.update({ where: { id }, data });
    }, { isolationLevel: 'Serializable' });
    await this.audit.log({ userId: actor.sub, action: 'UPDATE', entity: 'User', entityId: id, metadata: { fields: Object.keys(dto), removesLastSuperAdmin } });
    const { passwordHash, passwordAlgorithm, ...safe } = row;
    return safe;
  }
}

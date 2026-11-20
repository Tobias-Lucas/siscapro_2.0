import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsBoolean, IsDateString, IsOptional, IsString, Matches } from 'class-validator';
import { UserRole } from '../generated/prisma/client.js';
import { DepartmentOnly } from '../common/department-only.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { AuditService } from '../common/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';
import { PatchFieldsPipe } from '../common/patch-fields.pipe.js';
import { clean, toDate } from '../common/crud.util.js';

// These entities reproduce existing legacy academic registrations. They do not
// infer a new curriculum cycle or automatically allocate students and teachers.
class DisciplineDto {
  @IsString() name!: string;
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() teacherId?: string;
  @IsOptional() @IsString() legacyProfessorReference?: string;
  @IsOptional() @IsString() phaseCode?: string;
  @IsOptional() @IsString() moduleLabel?: string;
  @IsOptional() @IsString() workloadRaw?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() statusRaw?: string;
}
class CourseHoursDto {
  @IsString() courseId!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/) startTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/) endTime!: string;
  @IsString() shift!: string;
  @IsOptional() @IsString() unitRaw?: string;
  @IsOptional() @IsString() daysComboRaw?: string;
  @IsOptional() @IsString() courseComboRaw?: string;
  @IsOptional() @IsString() startTime2?: string;
  @IsOptional() @IsString() endTime2?: string;
  @IsOptional() @IsString() shift2?: string;
  @IsOptional() @IsString() daysCombo2Raw?: string;
  @IsOptional() @IsString() courseCombo2Raw?: string;
}
class TeachingDaysDto {
  @IsString() courseId!: string;
  @IsString() hoursId!: string;
  @IsBoolean() monday!: boolean;
  @IsBoolean() tuesday!: boolean;
  @IsBoolean() wednesday!: boolean;
  @IsBoolean() thursday!: boolean;
  @IsBoolean() friday!: boolean;
  @IsBoolean() saturday!: boolean;
  @IsOptional() @IsString() partCode?: string;
  @IsOptional() @IsString() unitRaw?: string;
}
class DisciplineTeacherDto {
  @IsString() courseId!: string;
  @IsString() disciplineId!: string;
  @IsString() teacherId!: string;
}
@Controller('academic')
@DepartmentOnly(UserRole.SECRETARY)
export class CurriculumController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get('teachers') teachers() {
    return this.prisma.user.findMany({ where: { role: UserRole.PROFESSOR }, select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 1500 });
  }

  @Get('disciplines') disciplines(@Query('courseId') courseId?: string) {
    return this.prisma.discipline.findMany({
      where: courseId ? { OR: [{ courseId }, { courseId: null }] } : {},
      include: { course: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } },
      orderBy: [{ phaseCode: 'asc' }, { name: 'asc' }], take: 1500,
    });
  }
  @Post('disciplines') async createDiscipline(@Body() dto: DisciplineDto, @CurrentUser() user: any) {
    const record = await this.prisma.discipline.create({ data: clean({ ...dto, startDate: toDate(dto.startDate), endDate: toDate(dto.endDate) }) as any });
    await this.audit.log({ userId: user.sub, action: 'CREATE_DISCIPLINE', entity: 'Discipline', entityId: record.id });
    return record;
  }
  @Patch('disciplines/:id') async updateDiscipline(@Param('id') id: string,
    @Body(new PatchFieldsPipe(['name','courseId','teacherId','legacyProfessorReference','phaseCode','moduleLabel','workloadRaw','startDate','endDate','statusRaw'])) dto: Partial<DisciplineDto>,
    @CurrentUser() user: any) {
    const record = await this.prisma.discipline.update({ where: { id }, data: clean({ ...dto, startDate: toDate(dto.startDate), endDate: toDate(dto.endDate) }) as any });
    await this.audit.log({ userId: user.sub, action: 'EDIT_DISCIPLINE', entity: 'Discipline', entityId: id });
    return record;
  }

  @Get('course-hours') courseHours(@Query('courseId') courseId?: string) {
    return this.prisma.courseHours.findMany({ where: courseId ? { courseId } : {}, include: { course: { select: { id: true, name: true } } },
      orderBy: [{ courseId: 'asc' }, { startTime: 'asc' }], take: 1500 });
  }
  @Post('course-hours') async createHours(@Body() dto: CourseHoursDto, @CurrentUser() user: any) {
    const record = await this.prisma.courseHours.create({ data: clean(dto) as any });
    await this.audit.log({ userId: user.sub, action: 'CREATE_COURSE_HOURS', entity: 'CourseHours', entityId: record.id });
    return record;
  }
  @Patch('course-hours/:id') async updateHours(@Param('id') id: string,
    @Body(new PatchFieldsPipe(['courseId','startTime','endTime','shift','daysComboRaw','courseComboRaw','startTime2','endTime2','shift2','daysCombo2Raw','courseCombo2Raw','unitRaw'])) dto: Partial<CourseHoursDto>,
    @CurrentUser() user: any) {
    const record = await this.prisma.courseHours.update({ where: { id }, data: clean(dto) as any });
    await this.audit.log({ userId: user.sub, action: 'EDIT_COURSE_HOURS', entity: 'CourseHours', entityId: id });
    return record;
  }

  @Get('teaching-days') teachingDays(@Query('courseId') courseId?: string) {
    return this.prisma.courseTeachingDays.findMany({ where: courseId ? { courseId } : {}, include: {
      course: { select: { id: true, name: true } }, hours: { select: { id: true, shift: true, startTime: true, endTime: true } },
    }, orderBy: { courseId: 'asc' }, take: 1500 });
  }
  @Post('teaching-days') async createTeachingDays(@Body() dto: TeachingDaysDto, @CurrentUser() user: any) {
    const hours = await this.prisma.courseHours.findUnique({ where: { id: dto.hoursId }, select: { courseId: true } });
    if (!hours || hours.courseId !== dto.courseId) throw new BadRequestException('Horario nao pertence ao curso informado');
    const record = await this.prisma.courseTeachingDays.create({ data: dto });
    await this.audit.log({ userId: user.sub, action: 'CREATE_TEACHING_DAYS', entity: 'CourseTeachingDays', entityId: record.id });
    return record;
  }
  @Patch('teaching-days/:id') async updateTeachingDays(@Param('id') id: string,
    @Body(new PatchFieldsPipe(['courseId','hoursId','monday','tuesday','wednesday','thursday','friday','saturday','partCode','unitRaw'],[],['monday','tuesday','wednesday','thursday','friday','saturday'])) dto: Partial<TeachingDaysDto>,
    @CurrentUser() user: any) {
    const existing = await this.prisma.courseTeachingDays.findUniqueOrThrow({ where: { id } });
    const hoursId = dto.hoursId ?? existing.hoursId;
    const courseId = dto.courseId ?? existing.courseId;
    const hours = await this.prisma.courseHours.findUnique({ where: { id: hoursId }, select: { courseId: true } });
    if (!hours || hours.courseId !== courseId) throw new BadRequestException('Horario nao pertence ao curso informado');
    const record = await this.prisma.courseTeachingDays.update({ where: { id }, data: clean(dto) as any });
    await this.audit.log({ userId: user.sub, action: 'EDIT_TEACHING_DAYS', entity: 'CourseTeachingDays', entityId: id });
    return record;
  }

  @Get('discipline-teachers') disciplineTeachers(@Query('courseId') courseId?: string) {
    return this.prisma.disciplineTeacher.findMany({ where: courseId ? { courseId } : {}, include: {
      course: { select: { id: true, name: true } }, discipline: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    }, orderBy: { createdAt: 'desc' }, take: 1500 });
  }
  @Post('discipline-teachers') async createDisciplineTeacher(@Body() dto: DisciplineTeacherDto, @CurrentUser() user: any) {
    const [disc, teacher] = await Promise.all([
      this.prisma.discipline.findUnique({ where: { id: dto.disciplineId } }),
      this.prisma.user.findUnique({ where: { id: dto.teacherId }, select: { role: true } }),
    ]);
    if (!disc || (disc.courseId && disc.courseId !== dto.courseId)) throw new BadRequestException('Disciplina nao compativel com o curso');
    if (teacher?.role !== UserRole.PROFESSOR) throw new BadRequestException('O usuario nao e um facilitador');
    const record = await this.prisma.disciplineTeacher.upsert({
      where: { courseId_disciplineId_teacherId: dto }, create: dto, update: {},
    });
    await this.audit.log({ userId: user.sub, action: 'LINK_DISCIPLINE_TEACHER', entity: 'DisciplineTeacher', entityId: record.id });
    return record;
  }
  @Delete('discipline-teachers/:id') async unlinkDisciplineTeacher(@Param('id') id: string, @CurrentUser() user: any) {
    await this.prisma.disciplineTeacher.delete({ where: { id } });
    await this.audit.log({ userId: user.sub, action: 'UNLINK_DISCIPLINE_TEACHER', entity: 'DisciplineTeacher', entityId: id });
    return { ok: true };
  }
}

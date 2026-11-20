import { Controller, Get } from '@nestjs/common';
import { UserRole } from '../generated/prisma/client.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { InternalOnly } from '../common/internal-only.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AccessService } from '../iam/access.service.js';

const OPEN_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING'] as const;
const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};
const money = (value: unknown) => Number(value ?? 0);
const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING: 'Pendente', PENDING_SIGNATURE: 'Aguardando assinatura', ACTIVE: 'Ativo', INACTIVE: 'Inativo', ARCHIVED: 'Arquivado',
  SUSPENDED: 'Suspenso', TERMINATED: 'Encerrado', CANCELLED: 'Cancelado', CLOSED: 'Encerrado',
  OPEN: 'Em aberto', IN_PROGRESS: 'Em andamento', WAITING: 'Aguardando', DONE: 'Concluído', COMPLETED: 'Concluído',
  APPROVED: 'Aprovado', REJECTED: 'Rejeitado', OVERDUE: 'Vencido', PAID: 'Pago', PARTIAL: 'Parcialmente pago', IN_ANALYSIS: 'Em análise', WAITING_DOCUMENTS: 'Aguardando documentos',
};
const statusLabel = (value: string) => statusLabels[value] || value;

@Controller('dashboard')
@InternalOnly()
export class DashboardController {
  constructor(private prisma: PrismaService, private access: AccessService) {}

  @Get('summary')
  async summary(@CurrentUser() user: any) {
    const now = new Date();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(today, 7);
    const thirtyDays = addDays(today, 30);
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
    const sixMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));

    const role = user?.role as UserRole;
    const canSeeFinanceByRole = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE]).has(role);
    const canSeeContractsByRole = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTRACTS, UserRole.HR]).has(role);
    const canSeeSecretaryByRole = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SECRETARY]).has(role);
    const canSeeServiceByRole = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTION, UserRole.SOCIAL_SERVICE, UserRole.SECRETARY]).has(role);
    const canSeeTriageByRole = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRIAGE, UserRole.COMMERCIAL]).has(role);

    const custom = user?.accessMode === 'CUSTOM' && role !== UserRole.SUPER_ADMIN;
    const permissionCodes = ['painel.financeiro.ver','contratos.instrumentos.visualizar','secretaria.turmas.visualizar','atendimento.requerimentos.visualizar','triagem.vagas.visualizar','documentos.arquivos.visualizar'];
    const decisions = custom ? await Promise.all(permissionCodes.map(code=>this.access.evaluate(user.sub,role,'CUSTOM',code))) : [];
    const allowed = (idx:number, fallback:boolean) => custom ? !!decisions[idx]?.allowed && decisions[idx].scope==='GLOBAL' : fallback;
    const canSeeFinance=allowed(0,canSeeFinanceByRole);
    const canSeeContracts=allowed(1,canSeeContractsByRole);
    const canSeeSecretary=allowed(2,canSeeSecretaryByRole);
    const canSeeService=allowed(3,canSeeServiceByRole);
    const canSeeTriage=allowed(4,canSeeTriageByRole);
    const canSeeDocuments=allowed(5,true);

    const openTitleWhere: any = { status: { in: [...OPEN_STATUSES] } };
    const overdueWhere: any = { ...openTitleWhere, dueDate: { lt: today } };
    const dueSoonWhere: any = { ...openTitleWhere, dueDate: { gte: today, lt: weekEnd } };

    const [
      activeStudents, activeEnrollments, activeContracts, activeCompanies, activeGroups, activeStaff,
      contractsExpiring30, expiredContracts, overdueTitleAggregate, overduePaymentsAggregate,
      dueSoonAggregate, dueSoonPaymentsAggregate, receivedMonthAggregate, openRequests, overdueRequests,
      pendingDocumentReviews, openVacancies, applicationsInProgress, contractsByStatusRaw,
      financialByStatusRaw, receiptsRaw, enrollmentsRaw, expiringContractsRaw, financialAttentionRaw,
      serviceAttentionRaw, lessonsToday, lessonsWeek, lessonsWithoutTeacher, lessonsWithoutRoom,
      academicLessonsRaw, curriculumMatrices, curriculumModules, activeClassrooms, teacherAvailabilityRules, scheduleTemplates, activeScheduleRules, scheduleGenerationRuns, openScheduleConflicts, legacyIssues,
    ] = await Promise.all([
      this.prisma.person.count({ where: { enrollments: { some: { status: 'ACTIVE' } }, NOT: { users: { some: { role: { not: UserRole.STUDENT } } } } } }),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.contract.count({ where: { status: 'ACTIVE' } }),
      this.prisma.company.count({ where: { status: 'ACTIVE' } }),
      this.prisma.classGroup.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { active: true, role: { notIn: [UserRole.STUDENT, UserRole.COMPANY, UserRole.PROFESSOR, UserRole.INTERNSHIP_SUPERVISOR] } } }),
      this.prisma.contract.count({ where: { status: 'ACTIVE', endDate: { gte: today, lt: thirtyDays } } }),
      this.prisma.contract.count({ where: { status: 'ACTIVE', endDate: { lt: today } } }),
      canSeeFinance ? this.prisma.financialTitle.aggregate({ where: overdueWhere, _sum: { amount: true }, _count: { _all: true } }) : Promise.resolve(null),
      canSeeFinance ? this.prisma.payment.aggregate({ where: { financialTitle: { is: overdueWhere } }, _sum: { amount: true } }) : Promise.resolve(null),
      canSeeFinance ? this.prisma.financialTitle.aggregate({ where: dueSoonWhere, _sum: { amount: true }, _count: { _all: true } }) : Promise.resolve(null),
      canSeeFinance ? this.prisma.payment.aggregate({ where: { financialTitle: { is: dueSoonWhere } }, _sum: { amount: true } }) : Promise.resolve(null),
      canSeeFinance ? this.prisma.payment.aggregate({ where: { paidAt: { gte: monthStart, lt: nextMonth } }, _sum: { amount: true } }) : Promise.resolve(null),
      canSeeService ? this.prisma.serviceRequest.count({ where: { status: { in: [...OPEN_STATUSES] } } }) : Promise.resolve(null),
      canSeeService ? this.prisma.serviceRequest.count({ where: { status: { in: [...OPEN_STATUSES] }, dueDate: { lt: today } } }) : Promise.resolve(null),
      canSeeDocuments ? this.prisma.documentReview.count({ where: { status: { in: [...OPEN_STATUSES] } } }) : Promise.resolve(null),
      canSeeTriage ? this.prisma.vacancy.count({ where: { status: 'ACTIVE' } }) : Promise.resolve(null),
      canSeeTriage ? this.prisma.application.count({ where: { status: { in: [...OPEN_STATUSES] } } }) : Promise.resolve(null),
      canSeeContracts ? this.prisma.contract.groupBy({ by: ['status'], _count: { _all: true } }) : Promise.resolve([]),
      canSeeFinance ? this.prisma.financialTitle.groupBy({ by: ['status'], _count: { _all: true } }) : Promise.resolve([]),
      canSeeFinance ? this.prisma.$queryRaw<Array<{ month: Date; total: string }>>`
        SELECT date_trunc('month', "paidAt") AS month, COALESCE(SUM("amount"), 0)::text AS total
        FROM "Payment" WHERE "paidAt" >= ${sixMonthStart} AND "paidAt" < ${nextMonth}
        GROUP BY date_trunc('month', "paidAt") ORDER BY month
      ` : Promise.resolve([]),
      canSeeSecretary ? this.prisma.$queryRaw<Array<{ month: Date; total: number }>>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS total
        FROM "Enrollment" WHERE "createdAt" >= ${sixMonthStart} AND "createdAt" < ${nextMonth}
        GROUP BY date_trunc('month', "createdAt") ORDER BY month
      ` : Promise.resolve([]),
      canSeeContracts ? this.prisma.contract.findMany({
        where: { status: 'ACTIVE', endDate: { gte: today, lt: thirtyDays } },
        select: { id: true, number: true, endDate: true, person: { select: { fullName: true } }, company: { select: { legalName: true, tradeName: true } } },
        orderBy: { endDate: 'asc' }, take: 8,
      }) : Promise.resolve([]),
      canSeeFinance ? this.prisma.financialTitle.findMany({
        where: { ...openTitleWhere, dueDate: { lt: weekEnd } },
        select: { id: true, description: true, dueDate: true, amount: true, company: { select: { legalName: true, tradeName: true } }, contract: { select: { person: { select: { fullName: true } } } }, payments: { select: { amount: true } } },
        orderBy: { dueDate: 'asc' }, take: 10,
      }) : Promise.resolve([]),
      canSeeService ? this.prisma.serviceRequest.findMany({
        where: { status: { in: [...OPEN_STATUSES] }, dueDate: { lt: weekEnd } },
        select: { id: true, type: true, description: true, dueDate: true, status: true, person: { select: { fullName: true } } },
        orderBy: { dueDate: 'asc' }, take: 8,
      }) : Promise.resolve([]),
      canSeeSecretary ? this.prisma.academicLesson.count({ where: { lessonDate: { gte: today, lt: tomorrow }, state: { not: 'CANCELLED' } } }) : Promise.resolve(null),
      canSeeSecretary ? this.prisma.academicLesson.count({ where: { lessonDate: { gte: today, lt: weekEnd }, state: { not: 'CANCELLED' } } }) : Promise.resolve(null),
      canSeeSecretary ? this.prisma.academicLesson.count({ where: { lessonDate: { gte: today, lt: weekEnd }, state: { not: 'CANCELLED' }, teacherId: null, classGroup: { is: { teacherAssignments: { none: {} } } } } }) : Promise.resolve(null),
      canSeeSecretary ? this.prisma.academicLesson.count({ where: { lessonDate: { gte: today, lt: weekEnd }, state: { not: 'CANCELLED' }, room: null, classroomId: null, classGroup: { is: { room: null, classroomId: null } } } }) : Promise.resolve(null),
      canSeeSecretary ? this.prisma.academicLesson.findMany({
        where: { lessonDate: { gte: today, lt: weekEnd }, state: { not: 'CANCELLED' } },
        select: { id: true, title: true, lessonDate: true, shift: true, room: true, state: true, teacher: { select: { name: true } }, discipline: { select: { name: true } }, classroom: { select: { name: true } }, classGroup: { select: { name: true, room: true, classroom: { select: { name: true } }, course: { select: { name: true } }, teacherAssignments: { select: { user: { select: { name: true } } } } } } },
        orderBy: [{ lessonDate: 'asc' }, { shift: 'asc' }], take: 60,
      }) : Promise.resolve([]),
      canSeeSecretary ? this.prisma.curriculumMatrix.count() : Promise.resolve(null),
      canSeeSecretary ? this.prisma.curriculumModule.count() : Promise.resolve(null),
      canSeeSecretary ? this.prisma.classroom.count({ where: { status: 'ACTIVE' } }) : Promise.resolve(null),
      canSeeSecretary ? this.prisma.teacherAvailability.count({ where: { availabilityType: 'AVAILABLE' } }) : Promise.resolve(null),
      canSeeSecretary ? this.prisma.scheduleTemplate.count() : Promise.resolve(null),
      canSeeSecretary ? this.prisma.scheduleRule.count({ where: { active: true } }) : Promise.resolve(null),
      canSeeSecretary ? this.prisma.scheduleGenerationRun.count() : Promise.resolve(null),
      canSeeSecretary ? this.prisma.scheduleConflict.count({ where: { resolutionStatus: 'OPEN' } }) : Promise.resolve(null),
      this.prisma.legacySyncIssue.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
    ]);

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (5 - index), 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      return { key, label: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', ''), value: 0 };
    });
    const monthIndex = new Map(months.map((month, index) => [month.key, index]));
    for (const row of receiptsRaw as Array<{ month: Date; total: string }>) {
      const date = new Date(row.month);
      const index = monthIndex.get(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
      if (index !== undefined) months[index].value = money(row.total);
    }
    const enrollmentMonths = months.map(month => ({ ...month, value: 0 }));
    for (const row of enrollmentsRaw as Array<{ month: Date; total: number }>) {
      const date = new Date(row.month);
      const index = monthIndex.get(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
      if (index !== undefined) enrollmentMonths[index].value = Number(row.total);
    }

    const expiringContracts = (expiringContractsRaw as any[]).map(item => ({
      ...item,
      companyName: item.company?.tradeName || item.company?.legalName || 'Empresa não vinculada',
      daysRemaining: item.endDate ? Math.max(0, Math.ceil((new Date(item.endDate).getTime() - today.getTime()) / 86400000)) : null,
    }));
    const financialAttention = (financialAttentionRaw as any[]).map(item => {
      const paid = item.payments.reduce((sum: number, payment: any) => sum + money(payment.amount), 0);
      return {
        id: item.id, description: item.description, dueDate: item.dueDate,
        amount: money(item.amount), paid, remaining: Math.max(0, money(item.amount) - paid),
        personName: item.contract?.person?.fullName || null,
        companyName: item.company?.tradeName || item.company?.legalName || null,
        overdue: new Date(item.dueDate) < today,
      };
    });

    return {
      generatedAt: now.toISOString(),
      permissions: { finance: canSeeFinance, contracts: canSeeContracts, secretary: canSeeSecretary, service: canSeeService, triage: canSeeTriage },
      metrics: {
        activeStudents, activeEnrollments, activeContracts, activeCompanies, activeGroups, activeStaff,
        contractsExpiring30: canSeeContracts ? contractsExpiring30 : null,
        expiredContracts: canSeeContracts ? expiredContracts : null,
        overdueTitles: canSeeFinance ? overdueTitleAggregate?._count?._all ?? 0 : null,
        overdueAmount: canSeeFinance ? Math.max(0, money(overdueTitleAggregate?._sum?.amount) - money(overduePaymentsAggregate?._sum?.amount)) : null,
        dueSoonTitles: canSeeFinance ? dueSoonAggregate?._count?._all ?? 0 : null,
        dueSoonAmount: canSeeFinance ? Math.max(0, money(dueSoonAggregate?._sum?.amount) - money(dueSoonPaymentsAggregate?._sum?.amount)) : null,
        receivedMonth: canSeeFinance ? money(receivedMonthAggregate?._sum?.amount) : null,
        openRequests, overdueRequests,
        pendingDocumentReviews, openVacancies, applicationsInProgress,
        lessonsToday, lessonsWeek, lessonsWithoutTeacher, lessonsWithoutRoom,
        openLegacyIssues: legacyIssues,
      },
      charts: {
        receiptsByMonth: canSeeFinance ? months : [],
        enrollmentsByMonth: canSeeSecretary ? enrollmentMonths : [],
        contractsByStatus: (contractsByStatusRaw as any[]).map(item => ({ status: item.status, label: statusLabel(item.status), value: item._count._all })),
        financialByStatus: (financialByStatusRaw as any[]).map(item => ({ status: item.status, label: statusLabel(item.status), value: item._count._all })),
      },
      expiringContracts,
      financialAttention,
      serviceAttention: serviceAttentionRaw,
      academicWeek: (academicLessonsRaw as any[]).map(item => ({
        id: item.id, title: item.title, lessonDate: item.lessonDate, shift: item.shift,
        room: item.room || item.classroom?.name || item.classGroup?.room || item.classGroup?.classroom?.name || null, state: item.state,
        teacherName: item.teacher?.name || item.classGroup?.teacherAssignments?.map((entry: any) => entry.user?.name).filter(Boolean).join(', ') || null, disciplineName: item.discipline?.name || null,
        classGroupName: item.classGroup?.name || 'Turma não informada', courseName: item.classGroup?.course?.name || null,
      })),
      scheduleReadiness: canSeeSecretary ? { curriculumMatrices, curriculumModules, activeClassrooms, teacherAvailabilityRules, scheduleTemplates, activeScheduleRules, scheduleGenerationRuns, openScheduleConflicts, registeredLessons: lessonsWeek, note: 'A estrutura acadêmica e os insumos do cronograma estão modelados. A geração automática, a validação de conflitos e a publicação ainda não estão ativadas.' } : null,
    };
  }
}

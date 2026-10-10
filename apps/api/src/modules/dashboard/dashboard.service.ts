import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditService } from '../audit/audit.service';
import { AttendanceRecord } from '../attendance/entities/attendance.entity';
import { PaymentRecord } from '../billing/entities/payment.entity';
import { PaymentTransaction } from '../billing/entities/payment-transaction.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ParentStudent } from '../parents/entities/parent-student.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import {
  AdminDashboardStatsDto,
  ArrearsKpiDto,
  AttendanceComplianceDto,
  ClassFillBucketDto,
  CollectionRateKpiDto,
  DailyCountDto,
  DashboardAlertDto,
  DashboardStatsDto,
  TeacherDashboardStatsDto,
} from './dto/dashboard-stats.dto';

interface Actor {
  id: string;
  role: RoleName;
}

const DEFAULT_MONTHLY_FEE = 2_500_000;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(ClassEntity) private readonly classes: Repository<ClassEntity>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AttendanceRecord) private readonly attendance: Repository<AttendanceRecord>,
    @InjectRepository(PaymentRecord) private readonly payments: Repository<PaymentRecord>,
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactions: Repository<PaymentTransaction>,
    @InjectRepository(ParentStudent) private readonly parentStudents: Repository<ParentStudent>,
    private readonly audit: AuditService,
  ) {}

  async getStats(actor: Actor): Promise<DashboardStatsDto> {
    if (actor.role === RoleName.TEACHER) {
      return this.getTeacherStats(actor.id);
    }
    return this.getAdminStats(actor.role);
  }

  async getRecentActivity(limit = 10): Promise<AuditLog[]> {
    return this.audit.recent(limit);
  }

  private async getAdminStats(
    role: RoleName.ADMIN | RoleName.MANAGER | RoleName.SUPER_ADMIN | RoleName,
  ): Promise<AdminDashboardStatsDto> {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' });
    const todayTashkent = formatter.format(new Date());
    const currentMonthStr = todayTashkent.slice(0, 7);

    const [
      activeStudentsList,
      archived,
      unassigned,
      classesTotal,
      teachersCount,
      classFillStats,
      daily,
      compliance,
      stuckPaymentsCount,
      unlinkedParentsCount,
    ] = await Promise.all([
      this.students.find({
        where: { status: StudentStatus.ACTIVE },
        select: ['id', 'enrolledAt'],
      }),
      this.students.count({ where: { status: StudentStatus.INACTIVE } }),
      this.students.count({
        where: { status: StudentStatus.ACTIVE, classId: IsNull() },
      }),
      this.classes.count({ where: { isActive: true } }),
      this.users.count({ where: { role: RoleName.TEACHER, isActive: true } }),
      this.computeAverageFill(),
      this.newStudentsByDay(7),
      this.computeCompliance(todayTashkent),
      this.computeStuckPaymentsCount(),
      this.computeUnlinkedParentsCount(),
    ]);

    const active = activeStudentsList.length;

    const [collectionRateKpi, arrearsKpi] = await Promise.all([
      this.computeCollectionRateKpi(active, todayTashkent),
      this.computeArrearsKpi(activeStudentsList, currentMonthStr),
    ]);

    const alerts = this.assembleAlerts(
      compliance,
      stuckPaymentsCount,
      arrearsKpi,
      unlinkedParentsCount,
    );

    const roleOut =
      role === RoleName.ADMIN || role === RoleName.MANAGER || role === RoleName.SUPER_ADMIN
        ? (role as RoleName.ADMIN | RoleName.MANAGER | RoleName.SUPER_ADMIN)
        : RoleName.ADMIN;

    return {
      role: roleOut,
      students: { total: active + archived, active, archived, unassigned },
      classes: {
        total: classesTotal,
        averageFillPercent: classFillStats.averageFillPercent,
        distribution: classFillStats.distribution,
      },
      teachersCount,
      newStudentsLast7Days: daily,
      compliance,
      collectionRateKpi,
      arrearsKpi,
      alerts,
    };
  }

  private async getTeacherStats(teacherId: string): Promise<TeacherDashboardStatsDto> {
    const klass = await this.classes.findOne({
      where: { classTeacherId: teacherId, isActive: true },
    });
    if (!klass) {
      return {
        role: RoleName.TEACHER,
        myClass: null,
        attendance: null,
        arrears: null,
      };
    }

    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' });
    const todayTashkent = formatter.format(new Date());

    // 1. isMarkedToday
    const markedTodayCount = await this.attendance
      .createQueryBuilder('a')
      .where('a.class_id = :classId', { classId: klass.id })
      .andWhere('a.date = :today', { today: todayTashkent })
      .getCount();
    const isMarkedToday = markedTodayCount > 0;

    // 2. weeklyAttendanceRate (Monday to today)
    const [year, month, day] = todayTashkent.split('-').map(Number);
    const todayDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = todayDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const mondayDate = new Date(Date.UTC(year, month - 1, day - daysSinceMonday));
    const mondayStr = mondayDate.toISOString().slice(0, 10);

    const weeklyRows = await this.attendance
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(a.id)', 'count')
      .where('a.class_id = :classId', { classId: klass.id })
      .andWhere('a.date >= :monday AND a.date <= :today', {
        monday: mondayStr,
        today: todayTashkent,
      })
      .groupBy('a.status')
      .getRawMany<{ status: string; count: string }>();

    let presentOrLate = 0;
    let totalWeekly = 0;
    for (const r of weeklyRows) {
      const c = Number(r.count) || 0;
      totalWeekly += c;
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        presentOrLate += c;
      }
    }
    const weeklyAttendanceRate =
      totalWeekly > 0 ? Math.round((presentOrLate / totalWeekly) * 1000) / 10 : 100;

    // 3. Arrears for active students in class
    const classStudents = await this.students.find({
      where: { classId: klass.id, status: StudentStatus.ACTIVE },
      select: ['id'],
    });

    const currentMonthStr = todayTashkent.slice(0, 7);
    let debtorCount = 0;
    let totalArrears = 0;

    if (classStudents.length > 0) {
      const studentIds = classStudents.map((s) => s.id);
      const paymentRows = await this.payments
        .createQueryBuilder('p')
        .select('p.student_id', 'studentId')
        .addSelect('SUM(p.amount)', 'totalPaid')
        .where('p.student_id IN (:...studentIds)', { studentIds })
        .andWhere('p.month = :month', { month: currentMonthStr })
        .andWhere('p.status = :status', { status: 'CONFIRMED' })
        .groupBy('p.student_id')
        .getRawMany<{ studentId: string; totalPaid: string }>();

      const paidMap = new Map<string, number>();
      for (const r of paymentRows) {
        paidMap.set(r.studentId, Number(r.totalPaid) || 0);
      }

      for (const s of classStudents) {
        const paid = paidMap.get(s.id) ?? 0;
        const gap = Math.max(0, DEFAULT_MONTHLY_FEE - paid);
        if (gap > 0) {
          debtorCount++;
          totalArrears += gap;
        }
      }
    }

    return {
      role: RoleName.TEACHER,
      myClass: {
        id: klass.id,
        name: klass.name,
        gradeLevel: klass.gradeLevel,
        academicYear: klass.academicYear,
        studentCount: classStudents.length,
        maxStudents: klass.maxStudents,
      },
      attendance: {
        isMarkedToday,
        weeklyAttendanceRate,
      },
      arrears: {
        debtorCount,
        totalArrears,
      },
    };
  }

  /**
   * Average fill percentage across every active class and bucketed distribution.
   */
  private async computeAverageFill(): Promise<{
    averageFillPercent: number;
    distribution: ClassFillBucketDto[];
  }> {
    const rows = await this.classes
      .createQueryBuilder('c')
      .leftJoin(Student, 's', 's.class_id = c.id AND s.status = :active AND s.deleted_at IS NULL', {
        active: StudentStatus.ACTIVE,
      })
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect('c.max_students', 'max')
      .addSelect('COUNT(s.id)', 'filled')
      .where('c.is_active = true AND c.deleted_at IS NULL')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.max_students')
      .getRawMany<{ id: string; name: string; max: number; filled: string }>();

    const buckets: Record<ClassFillBucketDto['bucket'], { label: string; classNames: string[] }> = {
      '<50%': { label: "<50% to'lgan", classNames: [] },
      '50-79%': { label: "50–79% to'lgan", classNames: [] },
      '80-99%': { label: "80–99% to'lgan", classNames: [] },
      '100%': { label: "To'liq (100%)", classNames: [] },
    };

    if (rows.length === 0) {
      const distribution: ClassFillBucketDto[] = (
        ['<50%', '50-79%', '80-99%', '100%'] as const
      ).map((b) => ({
        bucket: b,
        label: buckets[b].label,
        count: 0,
        classNames: [],
      }));
      return { averageFillPercent: 0, distribution };
    }

    let totalRatio = 0;
    for (const r of rows) {
      const max = Number(r.max);
      const filled = Number(r.filled);
      const ratio = max > 0 ? (filled / max) * 100 : 0;
      totalRatio += Math.min(100, ratio);
      const className = r.name ?? r.id;

      if (ratio < 50) {
        buckets['<50%'].classNames.push(className);
      } else if (ratio < 80) {
        buckets['50-79%'].classNames.push(className);
      } else if (ratio < 100) {
        buckets['80-99%'].classNames.push(className);
      } else {
        buckets['100%'].classNames.push(className);
      }
    }

    const averageFillPercent = Math.round((totalRatio / rows.length) * 10) / 10;
    const distribution: ClassFillBucketDto[] = (['<50%', '50-79%', '80-99%', '100%'] as const).map(
      (b) => ({
        bucket: b,
        label: buckets[b].label,
        count: buckets[b].classNames.length,
        classNames: buckets[b].classNames,
      }),
    );

    return { averageFillPercent, distribution };
  }

  private async computeCompliance(todayTashkent: string): Promise<AttendanceComplianceDto> {
    const expectedClassRows = await this.classes
      .createQueryBuilder('c')
      .innerJoin(
        Student,
        's',
        's.class_id = c.id AND s.status = :activeStatus AND s.deleted_at IS NULL',
        {
          activeStatus: StudentStatus.ACTIVE,
        },
      )
      .select('c.id', 'id')
      .where('c.is_active = true AND c.deleted_at IS NULL')
      .groupBy('c.id')
      .getRawMany<{ id: string }>();

    const expectedClasses = expectedClassRows.length;
    const expectedClassIds = expectedClassRows.map((r) => r.id);

    let markedClasses = 0;
    if (expectedClassIds.length > 0) {
      const markedRows = await this.attendance
        .createQueryBuilder('a')
        .select('a.class_id', 'classId')
        .where('a.class_id IN (:...expectedClassIds)', { expectedClassIds })
        .andWhere('a.date = :today', { today: todayTashkent })
        .groupBy('a.class_id')
        .getRawMany<{ classId: string }>();
      markedClasses = markedRows.length;
    }

    const rate =
      expectedClasses === 0 ? 100 : Math.round((markedClasses / expectedClasses) * 1000) / 10;
    const unmarkedClassesCount = Math.max(0, expectedClasses - markedClasses);

    // 30-day mean compliance
    const [y, m, d] = todayTashkent.split('-').map(Number);
    const thirtyDaysAgo = new Date(Date.UTC(y, m - 1, d - 29));
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const thirtyDayRows =
      expectedClassIds.length > 0
        ? await this.attendance
            .createQueryBuilder('a')
            .select('a.date', 'date')
            .addSelect('COUNT(DISTINCT a.class_id)', 'markedCount')
            .where('a.class_id IN (:...expectedClassIds)', { expectedClassIds })
            .andWhere('a.date >= :since AND a.date <= :today', {
              since: thirtyDaysAgoStr,
              today: todayTashkent,
            })
            .groupBy('a.date')
            .getRawMany<{ date: string; markedCount: string }>()
        : [];

    let thirtyDayMeanRate = rate;
    if (expectedClasses === 0) {
      thirtyDayMeanRate = 100;
    } else {
      const byDateMap = new Map<string, number>();
      for (const row of thirtyDayRows) {
        byDateMap.set(row.date, Number(row.markedCount));
      }
      const allThirtyDates: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const dt = new Date(Date.UTC(y, m - 1, d - i));
        allThirtyDates.push(dt.toISOString().slice(0, 10));
      }
      const sumRates = allThirtyDates.reduce(
        (acc, dateStr) => acc + ((byDateMap.get(dateStr) ?? 0) / expectedClasses) * 100,
        0,
      );
      thirtyDayMeanRate = Math.round((sumRates / 30) * 10) / 10;
    }

    return {
      expectedClasses,
      markedClasses,
      rate,
      thirtyDayMeanRate,
      unmarkedClassesCount,
    };
  }

  private async computeCollectionRateKpi(
    activeStudentsCount: number,
    todayTashkent: string,
  ): Promise<CollectionRateKpiDto> {
    const expectedMonthly = activeStudentsCount * DEFAULT_MONTHLY_FEE;

    const [currYear, currMonth, currDay] = todayTashkent.split('-').map(Number);
    const currentMonthStr = `${currYear}-${String(currMonth).padStart(2, '0')}`;

    const prevDate = new Date(Date.UTC(currYear, currMonth - 2, 1));
    const prevYear = prevDate.getUTCFullYear();
    const prevMonth = prevDate.getUTCMonth() + 1;
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const daysInPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
    const targetPrevDay = Math.min(currDay, daysInPrevMonth);
    const prevSameDayStr = `${prevMonthStr}-${String(targetPrevDay).padStart(2, '0')}`;

    const currentTashkentTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tashkent',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
    const prevCutoff = new Date(`${prevSameDayStr}T${currentTashkentTime}+05:00`);

    const currPaymentRow = await this.payments
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.month = :month', { month: currentMonthStr })
      .andWhere('p.status = :status', { status: 'CONFIRMED' })
      .getRawOne<{ total: string }>();
    const currCollected = Number(currPaymentRow?.total ?? 0);

    const prevPaymentRow = await this.payments
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.month = :month', { month: prevMonthStr })
      .andWhere('p.status = :status', { status: 'CONFIRMED' })
      .andWhere('p.paid_at <= :prevCutoff', { prevCutoff })
      .getRawOne<{ total: string }>();
    const prevCollected = Number(prevPaymentRow?.total ?? 0);

    const currentRate =
      expectedMonthly > 0 ? Math.round((currCollected / expectedMonthly) * 1000) / 10 : 100;
    const sameDayLastMonthRate =
      expectedMonthly > 0 ? Math.round((prevCollected / expectedMonthly) * 1000) / 10 : 100;
    const isCritical = currentRate < 80 && currentRate < sameDayLastMonthRate - 10;

    return {
      current: currentRate,
      sameDayLastMonth: sameDayLastMonthRate,
      isCritical,
    };
  }

  private async computeArrearsKpi(
    activeStudents: Pick<Student, 'id' | 'enrolledAt'>[],
    currentMonthStr: string,
  ): Promise<ArrearsKpiDto> {
    const paymentRows = await this.payments
      .createQueryBuilder('p')
      .select('p.student_id', 'studentId')
      .addSelect('p.month', 'month')
      .addSelect('SUM(p.amount)', 'totalPaid')
      .where('p.status = :status', { status: 'CONFIRMED' })
      .groupBy('p.student_id')
      .addGroupBy('p.month')
      .getRawMany<{ studentId: string; month: string; totalPaid: string }>();

    const paidMap = new Map<string, number>();
    for (const row of paymentRows) {
      paidMap.set(`${row.studentId}:${row.month}`, Number(row.totalPaid));
    }

    const [currYear, currMonth] = currentMonthStr.split('-').map(Number);
    const prevDate = new Date(Date.UTC(currYear, currMonth - 2, 1));
    const prevMonthStr = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;

    let totalArrears = 0;
    let previousMonthTotalArrears = 0;
    let debtorCount = 0;
    let priorMonthGapsCount = 0;

    for (const student of activeStudents) {
      let studentTotalArrears = 0;
      let studentPrevArrears = 0;
      let hasPriorGap = false;

      const enrolledDate = student.enrolledAt ? new Date(student.enrolledAt) : null;
      const enrolledMonthStr =
        enrolledDate && !isNaN(enrolledDate.getTime())
          ? new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Tashkent',
              year: 'numeric',
              month: '2-digit',
            }).format(enrolledDate)
          : currentMonthStr;

      const startMonthStr =
        enrolledMonthStr <= currentMonthStr ? enrolledMonthStr : currentMonthStr;
      const [startYear, startMonth] = startMonthStr.split('-').map(Number);

      let iterDate = new Date(Date.UTC(startYear, startMonth - 1, 1));
      const endDate = new Date(Date.UTC(currYear, currMonth - 1, 1));

      while (iterDate <= endDate) {
        const mStr = `${iterDate.getUTCFullYear()}-${String(iterDate.getUTCMonth() + 1).padStart(2, '0')}`;
        const paid = paidMap.get(`${student.id}:${mStr}`) ?? 0;
        const gap = Math.max(0, DEFAULT_MONTHLY_FEE - paid);

        if (gap > 0) {
          studentTotalArrears += gap;
          if (mStr < currentMonthStr) {
            hasPriorGap = true;
          }
        }
        if (mStr <= prevMonthStr) {
          studentPrevArrears += gap;
        }
        iterDate = new Date(Date.UTC(iterDate.getUTCFullYear(), iterDate.getUTCMonth() + 1, 1));
      }

      totalArrears += studentTotalArrears;
      previousMonthTotalArrears += studentPrevArrears;
      if (studentTotalArrears > 0) {
        debtorCount++;
      }
      if (hasPriorGap) {
        priorMonthGapsCount++;
      }
    }

    return {
      totalArrears,
      previousMonthTotalArrears,
      debtorCount,
      priorMonthGapsCount,
    };
  }

  private async computeStuckPaymentsCount(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.paymentTransactions
      .createQueryBuilder('pt')
      .where('pt.status = :status', { status: 'PENDING' })
      .andWhere('pt.created_at < :cutoff', { cutoff })
      .getCount();
  }

  private async computeUnlinkedParentsCount(): Promise<number> {
    return this.parentStudents
      .createQueryBuilder('ps')
      .innerJoin(User, 'u', 'u.id = ps.parent_user_id')
      .innerJoin(
        Student,
        's',
        's.id = ps.student_id AND s.status = :activeStatus AND s.deleted_at IS NULL',
        {
          activeStatus: StudentStatus.ACTIVE,
        },
      )
      .where('ps.is_primary = true')
      .andWhere('u.telegram_chat_id IS NULL')
      .getCount();
  }

  private assembleAlerts(
    compliance: AttendanceComplianceDto,
    stuckPaymentsCount: number,
    arrearsKpi: ArrearsKpiDto,
    unlinkedParentsCount: number,
  ): DashboardAlertDto[] {
    const alerts: DashboardAlertDto[] = [];

    if (compliance.unmarkedClassesCount > 0) {
      alerts.push({
        id: 'alert-unmarked-classes',
        level: 'critical',
        type: 'UNMARKED_CLASSES',
        title: 'Belgilanmagan darslar',
        count: compliance.unmarkedClassesCount,
        reason: `Bugun ${compliance.unmarkedClassesCount} ta faol sinfda davomat belgilanmagan`,
        link: '/attendance',
      });
    }

    if (stuckPaymentsCount > 0) {
      alerts.push({
        id: 'alert-stuck-payments',
        level: 'critical',
        type: 'STUCK_PAYMENTS',
        title: 'Qotib qolgan to‘lovlar',
        count: stuckPaymentsCount,
        reason: `${stuckPaymentsCount} ta to‘lov tranzaksiyasi 24 soatdan ortiq kutilmoqda (PENDING)`,
        link: '/billing',
      });
    }

    if (arrearsKpi.priorMonthGapsCount > 0) {
      alerts.push({
        id: 'alert-arrears',
        level: 'warning',
        type: 'ARREARS',
        title: 'O‘tgan oylardan qarzdorlik',
        count: arrearsKpi.priorMonthGapsCount,
        reason: `${arrearsKpi.priorMonthGapsCount} ta o‘quvchida o‘tgan oylar bo‘yicha to‘lanmagan qarz mavjud`,
        link: '/billing',
      });
    }

    if (unlinkedParentsCount > 0) {
      alerts.push({
        id: 'alert-unlinked-parents',
        level: 'warning',
        type: 'UNLINKED_PARENTS',
        title: 'Ulanmagan ota-onalar',
        count: unlinkedParentsCount,
        reason: `${unlinkedParentsCount} ta asosiy vasiyning Telegram akkaunti ulanmagan`,
        link: '/notifications',
      });
    }

    return alerts;
  }

  private async newStudentsByDay(days: number): Promise<DailyCountDto[]> {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' });
    const todayTashkent = formatter.format(new Date());
    const [year, month, day] = todayTashkent.split('-').map(Number);
    const startDay = new Date(Date.UTC(year, month - 1, day - (days - 1)));
    const startDayStr = startDay.toISOString().slice(0, 10);
    const since = new Date(`${startDayStr}T00:00:00+05:00`);

    const rows = await this.students
      .createQueryBuilder('s')
      .select("to_char(s.enrolled_at AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('s.enrolled_at >= :since', { since })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    // Backfill days with 0 so the frontend doesn't have to sparse-fill.
    const byDate = new Map<string, number>(rows.map((r) => [r.date, Number(r.count)]));
    const out: DailyCountDto[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + (i * 24 + 12) * 3600 * 1000);
      const iso = formatter.format(d);
      out.push({ date: iso, count: byDate.get(iso) ?? 0 });
    }
    return out;
  }
}

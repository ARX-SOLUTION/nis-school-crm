import { Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { AuditService } from '../audit/audit.service';
import { AttendanceRecord } from '../attendance/entities/attendance.entity';
import { PaymentRecord } from '../billing/entities/payment.entity';
import { PaymentTransaction } from '../billing/entities/payment-transaction.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ParentStudent } from '../parents/entities/parent-student.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const build = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' });
    const todayStr = formatter.format(new Date());
    const [year, month, day] = todayStr.split('-').map(Number);
    const threeDaysAgoDate = new Date(Date.UTC(year, month - 1, day - 3));
    const dateStr = threeDaysAgoDate.toISOString().slice(0, 10);
    const dailyRows = [{ date: dateStr, count: '3' }];
    const fillRows = [
      { id: 'c-1', max: 30, filled: '15' },
      { id: 'c-2', max: 30, filled: '30' },
    ];
    const dailyQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(dailyRows),
    };

    let classesQbCallCount = 0;
    const classesQb = {
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockImplementation(() => {
        const isFirst = classesQbCallCount++ === 0;
        return Promise.resolve(isFirst ? fillRows : [{ id: 'c-1' }, { id: 'c-2' }]);
      }),
    };

    let attendanceQbCallCount = 0;
    const attendanceQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getRawMany: jest.fn().mockImplementation(() => {
        const isFirst = attendanceQbCallCount++ % 2 === 0;
        return Promise.resolve(
          isFirst ? [{ classId: 'c-1' }] : [{ date: todayStr, markedCount: '1' }],
        );
      }),
    };

    let paymentsQbCallCount = 0;
    const paymentsQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockImplementation(() => {
        const call = paymentsQbCallCount++;
        return Promise.resolve(call === 0 ? { total: '150000000' } : { total: '140000000' });
      }),
      getRawMany: jest
        .fn()
        .mockResolvedValue([
          { studentId: 's-1', month: todayStr.slice(0, 7), totalPaid: '2500000' },
        ]),
    };

    const paymentTransactionsQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };

    const parentStudentsQb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };

    const students = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([{ id: 's-1', enrolledAt: new Date(todayStr) }]),
      createQueryBuilder: jest.fn().mockReturnValue(dailyQb),
    } as unknown as Repository<Student>;
    const classes = {
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(classesQb),
    } as unknown as Repository<ClassEntity>;
    const users = { count: jest.fn().mockResolvedValue(0) } as unknown as Repository<User>;
    const attendance = {
      createQueryBuilder: jest.fn().mockReturnValue(attendanceQb),
    } as unknown as Repository<AttendanceRecord>;
    const payments = {
      createQueryBuilder: jest.fn().mockReturnValue(paymentsQb),
    } as unknown as Repository<PaymentRecord>;
    const paymentTransactions = {
      createQueryBuilder: jest.fn().mockReturnValue(paymentTransactionsQb),
    } as unknown as Repository<PaymentTransaction>;
    const parentStudents = {
      createQueryBuilder: jest.fn().mockReturnValue(parentStudentsQb),
    } as unknown as Repository<ParentStudent>;
    const audit = { recent: jest.fn().mockResolvedValue([]) } as unknown as AuditService;

    return {
      service: new DashboardService(
        students,
        classes,
        users,
        attendance,
        payments,
        paymentTransactions,
        parentStudents,
        audit,
      ),
      students: students as unknown as {
        count: jest.Mock;
        find: jest.Mock;
        createQueryBuilder: jest.Mock;
      },
      classes: classes as unknown as {
        count: jest.Mock;
        findOne: jest.Mock;
        createQueryBuilder: jest.Mock;
      },
      users: users as unknown as { count: jest.Mock },
      attendance: attendance as unknown as { createQueryBuilder: jest.Mock },
      payments: payments as unknown as { createQueryBuilder: jest.Mock },
      paymentTransactions: paymentTransactions as unknown as { createQueryBuilder: jest.Mock },
      parentStudents: parentStudents as unknown as { createQueryBuilder: jest.Mock },
      audit: audit as unknown as { recent: jest.Mock },
      dailyQb,
      classesQb,
      attendanceQb,
      paymentsQb,
      paymentTransactionsQb,
      parentStudentsQb,
    };
  };

  describe('admin stats', () => {
    it('should_aggregate_student_class_and_teacher_counts', async () => {
      const { service, students, classes, users } = build();
      students.count
        .mockResolvedValueOnce(1) // archived
        .mockResolvedValueOnce(0); // unassigned
      students.find.mockResolvedValueOnce([
        { id: 's-1', enrolledAt: new Date() },
        { id: 's-2', enrolledAt: new Date() },
      ]);
      classes.count.mockResolvedValueOnce(4);
      users.count.mockResolvedValueOnce(5);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');
      expect(stats.role).toBe(RoleName.ADMIN);
      expect(stats.students).toEqual({ total: 3, active: 2, archived: 1, unassigned: 0 });
      expect(stats.classes.total).toBe(4);
      expect(stats.teachersCount).toBe(5);
      expect(stats.compliance).toBeDefined();
      expect(stats.collectionRateKpi).toBeDefined();
      expect(stats.arrearsKpi).toBeDefined();
      expect(stats.alerts).toBeDefined();
    });

    it('should_compute_average_fill_percent_across_active_classes', async () => {
      const { service, students, classes, users } = build();
      students.count.mockResolvedValue(0);
      classes.count.mockResolvedValue(0);
      users.count.mockResolvedValue(0);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');
      // (15/30 + 30/30) / 2 = 75
      expect(stats.classes.averageFillPercent).toBe(75);
    });

    it('should_backfill_missing_days_in_weekly_series_with_zero', async () => {
      const { service, students, classes, users } = build();
      students.count.mockResolvedValue(0);
      classes.count.mockResolvedValue(0);
      users.count.mockResolvedValue(0);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');
      expect(stats.newStudentsLast7Days).toHaveLength(7);
      const nonZero = stats.newStudentsLast7Days.filter((d) => d.count > 0);
      expect(nonZero).toHaveLength(1);
      expect(nonZero[0]?.count).toBe(3);
    });

    it('should_generate_daily_series_in_asia_tashkent_timezone (DEF-05)', async () => {
      const { service, dailyQb } = build();
      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' });
      const todayTashkent = formatter.format(new Date());

      // Last item in series must correspond to today in Asia/Tashkent
      expect(stats.newStudentsLast7Days[6].date).toBe(todayTashkent);
      // Query builder should filter on since
      expect(dailyQb.where).toHaveBeenCalledWith(
        's.enrolled_at >= :since',
        expect.objectContaining({
          since: expect.any(Date),
        }),
      );
    });

    it('should_compute_compliance_and_trigger_unmarked_classes_alert', async () => {
      const { service, attendanceQb } = build();
      // 2 expected classes, but only 1 marked
      attendanceQb.getRawMany.mockImplementationOnce(() => Promise.resolve([{ classId: 'c-1' }]));

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      expect(stats.compliance.expectedClasses).toBe(2);
      expect(stats.compliance.markedClasses).toBe(1);
      expect(stats.compliance.rate).toBe(50);
      expect(stats.compliance.unmarkedClassesCount).toBe(1);

      const unmarkedAlert = stats.alerts.find((a) => a.type === 'UNMARKED_CLASSES');
      expect(unmarkedAlert).toBeDefined();
      expect(unmarkedAlert?.level).toBe('critical');
      expect(unmarkedAlert?.link).toBe('/attendance');
    });

    it('should_compute_same_day_last_month_rate_and_critical_threshold', async () => {
      const { service, paymentsQb, students } = build();
      students.find.mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, i) => ({ id: `s-${i}`, enrolledAt: new Date() })),
      );
      // Expected = 100 * 2,500,000 = 250,000,000
      // Current = 150,000,000 (60%), Prev = 200,000,000 (80%) -> current < 80 && current < 80 - 10 -> isCritical = true
      let call = 0;
      paymentsQb.getRawOne.mockImplementation(() => {
        const isFirst = call++ === 0;
        return Promise.resolve(isFirst ? { total: '150000000' } : { total: '200000000' });
      });

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      expect(stats.collectionRateKpi.current).toBe(60);
      expect(stats.collectionRateKpi.sameDayLastMonth).toBe(80);
      expect(stats.collectionRateKpi.isCritical).toBe(true);
    });

    it('should_generate_stuck_payments_alert_when_pending_gt_24h', async () => {
      const { service, paymentTransactionsQb } = build();
      paymentTransactionsQb.getCount.mockResolvedValueOnce(3);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      const alert = stats.alerts.find((a) => a.type === 'STUCK_PAYMENTS');
      expect(alert).toBeDefined();
      expect(alert?.level).toBe('critical');
      expect(alert?.count).toBe(3);
      expect(alert?.link).toBe('/billing');
    });

    it('should_generate_unlinked_parents_alert', async () => {
      const { service, parentStudentsQb } = build();
      parentStudentsQb.getCount.mockResolvedValueOnce(7);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      const alert = stats.alerts.find((a) => a.type === 'UNLINKED_PARENTS');
      expect(alert).toBeDefined();
      expect(alert?.level).toBe('warning');
      expect(alert?.count).toBe(7);
      expect(alert?.link).toBe('/notifications');
    });

    it('should_backfill_30_day_window_with_zeros_for_unmarked_days_in_compliance_mean (DEF-17)', async () => {
      const { service, attendanceQb } = build();
      attendanceQb.getRawMany
        .mockResolvedValueOnce([{ classId: 'c-1' }, { classId: 'c-2' }])
        .mockResolvedValueOnce([
          { date: '2026-10-01', markedCount: '2' },
          { date: '2026-10-02', markedCount: '2' },
          { date: '2026-10-03', markedCount: '2' },
        ]);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      expect(stats.compliance.thirtyDayMeanRate).toBe(10);
    });

    it('should_join_active_students_when_counting_unlinked_parents (DEF-18)', async () => {
      const { service, parentStudentsQb } = build();
      parentStudentsQb.getCount.mockResolvedValueOnce(7);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      expect(parentStudentsQb.innerJoin).toHaveBeenCalledWith(
        Student,
        's',
        's.id = ps.student_id AND s.status = :activeStatus AND s.deleted_at IS NULL',
        { activeStatus: StudentStatus.ACTIVE },
      );
    });

    it('should_handle_invalid_enrolled_at_date_without_throwing_range_error (DEF-20)', async () => {
      const { service, students } = build();
      students.find.mockResolvedValueOnce([
        { id: 's-invalid', enrolledAt: 'not-a-valid-date' as unknown as Date },
      ]);

      await expect(service.getStats({ id: 'a-1', role: RoleName.ADMIN })).resolves.toBeDefined();
    });

    it('should_be_silent_when_healthy', async () => {
      const { service, attendanceQb, paymentTransactionsQb, parentStudentsQb, paymentsQb } =
        build();
      // All 2 classes marked
      attendanceQb.getRawMany.mockImplementation(() =>
        Promise.resolve([{ classId: 'c-1' }, { classId: 'c-2' }]),
      );
      paymentTransactionsQb.getCount.mockResolvedValue(0);
      parentStudentsQb.getCount.mockResolvedValue(0);
      // No unpaid gap
      paymentsQb.getRawMany.mockResolvedValue([
        { studentId: 's-1', month: '2026-10', totalPaid: '2500000' },
      ]);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      expect(stats.alerts).toEqual([]);
    });

    it('should_compute_class_fill_distribution_across_buckets', async () => {
      const { service, classesQb } = build();
      classesQb.getRawMany.mockResolvedValueOnce([
        { id: 'c-1', name: '1-A', max: 30, filled: '10' }, // 33.3% -> <50%
        { id: 'c-2', name: '2-B', max: 30, filled: '18' }, // 60.0% -> 50-79%
        { id: 'c-3', name: '3-A', max: 30, filled: '27' }, // 90.0% -> 80-99%
        { id: 'c-4', name: '4-C', max: 20, filled: '20' }, // 100% -> 100%
      ]);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');

      const dist = stats.classes.distribution;
      expect(dist).toHaveLength(4);
      expect(dist.find((b) => b.bucket === '<50%')).toEqual({
        bucket: '<50%',
        label: "<50% to'lgan",
        count: 1,
        classNames: ['1-A'],
      });
      expect(dist.find((b) => b.bucket === '50-79%')).toEqual({
        bucket: '50-79%',
        label: "50–79% to'lgan",
        count: 1,
        classNames: ['2-B'],
      });
      expect(dist.find((b) => b.bucket === '80-99%')).toEqual({
        bucket: '80-99%',
        label: "80–99% to'lgan",
        count: 1,
        classNames: ['3-A'],
      });
      expect(dist.find((b) => b.bucket === '100%')).toEqual({
        bucket: '100%',
        label: "To'liq (100%)",
        count: 1,
        classNames: ['4-C'],
      });
    });
  });

  describe('teacher stats', () => {
    it('should_return_nulls_when_no_class_assigned', async () => {
      const { service, classes } = build();
      classes.findOne.mockResolvedValue(null);
      const stats = await service.getStats({ id: 't-1', role: RoleName.TEACHER });
      expect(stats.role).toBe(RoleName.TEACHER);
      if (stats.role !== RoleName.TEACHER) throw new Error('wrong branch');
      expect(stats.myClass).toBeNull();
      expect(stats.attendance).toBeNull();
      expect(stats.arrears).toBeNull();
    });

    it('should_return_actionable_kpis_when_class_is_assigned', async () => {
      const { service, classes, students, attendanceQb, paymentsQb } = build();
      classes.findOne.mockResolvedValue({
        id: 'c-1',
        name: '4-A',
        gradeLevel: 4,
        academicYear: '2026-2027',
        maxStudents: 30,
      });
      students.find.mockResolvedValueOnce([{ id: 's-1' }, { id: 's-2' }]);
      // isMarkedToday -> 1
      attendanceQb.getCount.mockResolvedValueOnce(1);
      // weeklyAttendanceRate: 15 present, 3 late, 2 absent = (15+3)/20 * 100 = 90.0%
      attendanceQb.getRawMany.mockResolvedValueOnce([
        { status: 'PRESENT', count: '15' },
        { status: 'LATE', count: '3' },
        { status: 'ABSENT', count: '2' },
      ]);
      // arrears: s-1 paid 2_500_000 (0 gap), s-2 paid 1_500_000 (1_000_000 gap)
      paymentsQb.getRawMany.mockResolvedValueOnce([
        { studentId: 's-1', totalPaid: '2500000' },
        { studentId: 's-2', totalPaid: '1500000' },
      ]);

      const stats = await service.getStats({ id: 't-1', role: RoleName.TEACHER });
      if (stats.role !== RoleName.TEACHER) throw new Error('wrong branch');
      expect(stats.myClass).toEqual({
        id: 'c-1',
        name: '4-A',
        gradeLevel: 4,
        academicYear: '2026-2027',
        studentCount: 2,
        maxStudents: 30,
      });
      expect(stats.attendance).toEqual({
        isMarkedToday: true,
        weeklyAttendanceRate: 90,
      });
      expect(stats.arrears).toEqual({
        debtorCount: 1,
        totalArrears: 1_000_000,
      });
    });
  });

  describe('recent activity', () => {
    it('should_delegate_to_audit_service', async () => {
      const { service, audit } = build();
      await service.getRecentActivity(5);
      expect(audit.recent).toHaveBeenCalledWith(5);
    });
  });
});

import { Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { AuditService } from '../audit/audit.service';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const build = () => {
    const dailyRows = [{ date: '2026-04-23', count: '3' }];
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
    const fillQb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(fillRows),
    };

    const students = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(dailyQb),
    } as unknown as Repository<Student>;
    const classes = {
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(fillQb),
    } as unknown as Repository<ClassEntity>;
    const users = { count: jest.fn().mockResolvedValue(0) } as unknown as Repository<User>;
    const audit = { recent: jest.fn().mockResolvedValue([]) } as unknown as AuditService;

    return {
      service: new DashboardService(students, classes, users, audit),
      students: students as unknown as { count: jest.Mock; createQueryBuilder: jest.Mock },
      classes: classes as unknown as {
        count: jest.Mock;
        findOne: jest.Mock;
        createQueryBuilder: jest.Mock;
      },
      users: users as unknown as { count: jest.Mock },
      audit: audit as unknown as { recent: jest.Mock },
      dailyQb,
      fillQb,
    };
  };

  describe('admin stats', () => {
    it('should_aggregate_student_class_and_teacher_counts', async () => {
      const { service, students, classes, users } = build();
      students.count
        .mockResolvedValueOnce(10) // active
        .mockResolvedValueOnce(2) // archived
        .mockResolvedValueOnce(1); // unassigned
      classes.count.mockResolvedValueOnce(4);
      users.count.mockResolvedValueOnce(5);

      const stats = await service.getStats({ id: 'a-1', role: RoleName.ADMIN });
      if (stats.role === RoleName.TEACHER) throw new Error('wrong branch');
      expect(stats.role).toBe(RoleName.ADMIN);
      expect(stats.students).toEqual({ total: 12, active: 10, archived: 2, unassigned: 1 });
      expect(stats.classes.total).toBe(4);
      expect(stats.teachersCount).toBe(5);
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
  });

  describe('teacher stats', () => {
    it('should_return_null_when_no_class_assigned', async () => {
      const { service, classes } = build();
      classes.findOne.mockResolvedValue(null);
      const stats = await service.getStats({ id: 't-1', role: RoleName.TEACHER });
      expect(stats.role).toBe(RoleName.TEACHER);
      if (stats.role !== RoleName.TEACHER) throw new Error('wrong branch');
      expect(stats.myClass).toBeNull();
    });

    it('should_return_class_summary_when_assigned', async () => {
      const { service, classes, students } = build();
      classes.findOne.mockResolvedValue({
        id: 'c-1',
        name: '4-A',
        gradeLevel: 4,
        academicYear: '2026-2027',
        maxStudents: 30,
      });
      students.count.mockResolvedValueOnce(12);
      const stats = await service.getStats({ id: 't-1', role: RoleName.TEACHER });
      if (stats.role !== RoleName.TEACHER) throw new Error('wrong branch');
      expect(stats.myClass).toEqual({
        id: 'c-1',
        name: '4-A',
        gradeLevel: 4,
        academicYear: '2026-2027',
        studentCount: 12,
        maxStudents: 30,
      });
      expect(students.count).toHaveBeenCalledWith({
        where: { classId: 'c-1', status: StudentStatus.ACTIVE },
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

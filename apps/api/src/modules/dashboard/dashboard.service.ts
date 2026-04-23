import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditService } from '../audit/audit.service';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import {
  AdminDashboardStatsDto,
  DashboardStatsDto,
  DailyCountDto,
  TeacherDashboardStatsDto,
} from './dto/dashboard-stats.dto';

interface Actor {
  id: string;
  role: RoleName;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(ClassEntity) private readonly classes: Repository<ClassEntity>,
    @InjectRepository(User) private readonly users: Repository<User>,
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
    const [active, archived, unassigned, classesTotal, teachersCount, averageFill] =
      await Promise.all([
        this.students.count({ where: { status: StudentStatus.ACTIVE } }),
        this.students.count({ where: { status: StudentStatus.INACTIVE } }),
        this.students.count({
          where: { status: StudentStatus.ACTIVE, classId: IsNull() },
        }),
        this.classes.count({ where: { isActive: true } }),
        this.users.count({ where: { role: RoleName.TEACHER, isActive: true } }),
        this.computeAverageFill(),
      ]);

    const daily = await this.newStudentsByDay(7);
    const roleOut =
      role === RoleName.ADMIN || role === RoleName.MANAGER || role === RoleName.SUPER_ADMIN
        ? (role as RoleName.ADMIN | RoleName.MANAGER | RoleName.SUPER_ADMIN)
        : RoleName.ADMIN;

    return {
      role: roleOut,
      students: { total: active + archived, active, archived, unassigned },
      classes: { total: classesTotal, averageFillPercent: averageFill },
      teachersCount,
      newStudentsLast7Days: daily,
    };
  }

  private async getTeacherStats(teacherId: string): Promise<TeacherDashboardStatsDto> {
    const klass = await this.classes.findOne({
      where: { classTeacherId: teacherId, isActive: true },
    });
    if (!klass) {
      return { role: RoleName.TEACHER, myClass: null };
    }
    const studentCount = await this.students.count({
      where: { classId: klass.id, status: StudentStatus.ACTIVE },
    });
    return {
      role: RoleName.TEACHER,
      myClass: {
        id: klass.id,
        name: klass.name,
        gradeLevel: klass.gradeLevel,
        academicYear: klass.academicYear,
        studentCount,
        maxStudents: klass.maxStudents,
      },
    };
  }

  /**
   * Average fill percentage across every active class. A class with zero
   * max_students is treated as 0% rather than NaN so the ratio stays numeric.
   */
  private async computeAverageFill(): Promise<number> {
    const rows = await this.classes
      .createQueryBuilder('c')
      .leftJoin(Student, 's', 's.class_id = c.id AND s.status = :active AND s.deleted_at IS NULL', {
        active: StudentStatus.ACTIVE,
      })
      .select('c.id', 'id')
      .addSelect('c.max_students', 'max')
      .addSelect('COUNT(s.id)', 'filled')
      .where('c.is_active = true AND c.deleted_at IS NULL')
      .groupBy('c.id')
      .addGroupBy('c.max_students')
      .getRawMany<{ id: string; max: number; filled: string }>();

    if (rows.length === 0) return 0;
    const ratios = rows.map((r) => {
      const max = Number(r.max);
      if (!max) return 0;
      return Math.min(100, (Number(r.filled) / max) * 100);
    });
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    return Math.round(avg * 10) / 10;
  }

  private async newStudentsByDay(days: number): Promise<DailyCountDto[]> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (days - 1));
    since.setUTCHours(0, 0, 0, 0);

    const rows = await this.students
      .createQueryBuilder('s')
      .select("to_char(s.enrolled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('s.enrolled_at >= :since', { since })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    // Backfill days with 0 so the frontend doesn't have to sparse-fill.
    const byDate = new Map<string, number>(rows.map((r) => [r.date, Number(r.count)]));
    const out: DailyCountDto[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ date: iso, count: byDate.get(iso) ?? 0 });
    }
    return out;
  }
}

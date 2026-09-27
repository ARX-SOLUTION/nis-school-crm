import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  AttendanceReportQueryDto,
  ClassAttendanceReportDto,
  FinanceReportDto,
  FinanceReportQueryDto,
  GradesReportQueryDto,
  MonthlyRevenueDto,
  SubjectGradeReportDto,
  TopStudentDto,
} from '@nis/shared';
import { AttendanceRecord } from '../attendance/entities/attendance.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { GradeRecord } from '../grades/entities/grade.entity';
import { PaymentRecord } from '../billing/entities/payment.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { Subject } from '../subjects/entities/subject.entity';

const DEFAULT_MONTHLY_FEE = 2_500_000;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepo: Repository<AttendanceRecord>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(GradeRecord)
    private readonly gradeRepo: Repository<GradeRecord>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRepo: Repository<PaymentRecord>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async getAttendanceReport(query?: AttendanceReportQueryDto): Promise<ClassAttendanceReportDto[]> {
    const targetMonth = query?.month || new Date().toISOString().slice(0, 7);
    const [year, month] = targetMonth.split('-').map(Number);
    const startDate = `${targetMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;

    const classQb = this.classRepo.createQueryBuilder('c').where('c.isActive = true');
    if (query?.classId) {
      classQb.andWhere('c.id = :classId', { classId: query.classId });
    }
    const classes = await classQb.orderBy('c.gradeLevel').addOrderBy('c.name').getMany();

    const results: ClassAttendanceReportDto[] = [];

    for (const cls of classes) {
      const studentCount = await this.studentRepo.count({
        where: { classId: cls.id, status: StudentStatus.ACTIVE },
      });

      const records = await this.attendanceRepo
        .createQueryBuilder('att')
        .select('att.status', 'status')
        .addSelect('COUNT(*)', 'cnt')
        .where('att.classId = :classId', { classId: cls.id })
        .andWhere('att.date >= :startDate', { startDate })
        .andWhere('att.date <= :endDate', { endDate })
        .groupBy('att.status')
        .getRawMany<{ status: string; cnt: string }>();

      let totalRecords = 0;
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let excusedCount = 0;

      for (const r of records) {
        const c = Number(r.cnt);
        totalRecords += c;
        if (r.status === 'PRESENT') presentCount += c;
        else if (r.status === 'ABSENT') absentCount += c;
        else if (r.status === 'LATE') lateCount += c;
        else if (r.status === 'EXCUSED') excusedCount += c;
      }

      const attendanceRate =
        totalRecords > 0
          ? Math.round(((presentCount + lateCount + excusedCount) / totalRecords) * 100)
          : 100;

      results.push({
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        totalStudents: studentCount,
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
        month: targetMonth,
      });
    }

    return results;
  }

  async getGradesReport(query?: GradesReportQueryDto): Promise<{
    subjects: SubjectGradeReportDto[];
    topStudents: TopStudentDto[];
  }> {
    // Subject-level summary
    const subjectQb = this.gradeRepo
      .createQueryBuilder('gr')
      .innerJoin('gr.subject', 'subj')
      .innerJoin('gr.class', 'cls')
      .select('gr.subjectId', 'subjectId')
      .addSelect('subj.name', 'subjectName')
      .addSelect('gr.classId', 'classId')
      .addSelect('cls.name', 'className')
      .addSelect('COUNT(*)', 'totalRecorded')
      .addSelect(
        'AVG(CAST(gr.score AS DECIMAL) / NULLIF(CAST(gr.maxScore AS DECIMAL), 0) * 100)',
        'avgPct',
      )
      .addSelect('MAX(gr.score)', 'highestScore')
      .addSelect('MIN(gr.score)', 'lowestScore')
      .addSelect(
        `SUM(CASE WHEN CAST(gr.score AS DECIMAL) / NULLIF(CAST(gr.maxScore AS DECIMAL), 0) >= 0.6 THEN 1 ELSE 0 END)`,
        'passingCount',
      )
      .groupBy('gr.subjectId')
      .addGroupBy('subj.name')
      .addGroupBy('gr.classId')
      .addGroupBy('cls.name');

    if (query?.classId) {
      subjectQb.andWhere('gr.classId = :classId', { classId: query.classId });
    }
    if (query?.subjectId) {
      subjectQb.andWhere('gr.subjectId = :subjectId', { subjectId: query.subjectId });
    }

    const subjectRows = await subjectQb.orderBy('subj.name').getRawMany<{
      subjectId: string;
      subjectName: string;
      classId: string;
      className: string;
      totalRecorded: string;
      avgPct: string;
      highestScore: string;
      lowestScore: string;
      passingCount: string;
    }>();

    const subjects: SubjectGradeReportDto[] = subjectRows.map((r) => {
      const total = Number(r.totalRecorded);
      const passing = Number(r.passingCount);
      return {
        subjectId: r.subjectId,
        subjectName: r.subjectName,
        classId: r.classId,
        className: r.className,
        totalRecorded: total,
        averageScore: Math.round(Number(r.avgPct) * 10) / 10,
        highestScore: Number(r.highestScore),
        lowestScore: Number(r.lowestScore),
        passingCount: passing,
        passingRate: total > 0 ? Math.round((passing / total) * 100) : 0,
      };
    });

    // Top 10 students by average score
    const topQb = this.gradeRepo
      .createQueryBuilder('gr')
      .innerJoin('gr.student', 'stu')
      .leftJoin('stu.class', 'cls')
      .select('gr.studentId', 'studentId')
      .addSelect('stu.firstName', 'firstName')
      .addSelect('stu.lastName', 'lastName')
      .addSelect('stu.studentCode', 'studentCode')
      .addSelect('cls.name', 'className')
      .addSelect('COUNT(*)', 'totalGrades')
      .addSelect(
        'AVG(CAST(gr.score AS DECIMAL) / NULLIF(CAST(gr.maxScore AS DECIMAL), 0) * 100)',
        'avgPct',
      )
      .groupBy('gr.studentId')
      .addGroupBy('stu.firstName')
      .addGroupBy('stu.lastName')
      .addGroupBy('stu.studentCode')
      .addGroupBy('cls.name')
      .orderBy('"avgPct"', 'DESC')
      .limit(10);

    if (query?.classId) {
      topQb.andWhere('gr.classId = :classId', { classId: query.classId });
    }

    const topRows = await topQb.getRawMany<{
      studentId: string;
      firstName: string;
      lastName: string;
      studentCode: string;
      className: string | null;
      totalGrades: string;
      avgPct: string;
    }>();

    const topStudents: TopStudentDto[] = topRows.map((r) => ({
      studentId: r.studentId,
      studentName: `${r.lastName} ${r.firstName}`,
      studentCode: r.studentCode,
      className: r.className ?? null,
      averageScore: Math.round(Number(r.avgPct) * 10) / 10,
      totalGrades: Number(r.totalGrades),
    }));

    return { subjects, topStudents };
  }

  async getFinanceReport(query?: FinanceReportQueryDto): Promise<FinanceReportDto> {
    const months = Math.min(query?.months ?? 6, 12);
    const now = new Date();
    const activeStudents = await this.studentRepo.count({
      where: { status: StudentStatus.ACTIVE },
    });
    const expectedPerMonth = activeStudents * DEFAULT_MONTHLY_FEE;

    const monthlyData: MonthlyRevenueDto[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const { totalCollected, paymentCount } = await this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'totalCollected')
        .addSelect('COUNT(*)', 'paymentCount')
        .where('p.month = :month', { month: monthStr })
        .andWhere('p.status = :status', { status: 'CONFIRMED' })
        .getRawOne();

      const collected = Number(totalCollected);
      monthlyData.push({
        month: monthStr,
        totalCollected: collected,
        totalExpected: expectedPerMonth,
        collectionRate:
          expectedPerMonth > 0
            ? Math.min(100, Math.round((collected / expectedPerMonth) * 100))
            : 0,
        paymentCount: Number(paymentCount),
      });
    }

    const totalCollectedPeriod = monthlyData.reduce((acc, m) => acc + m.totalCollected, 0);
    const averageMonthlyRevenue = months > 0 ? Math.round(totalCollectedPeriod / months) : 0;

    return { months: monthlyData, totalCollectedPeriod, averageMonthlyRevenue };
  }
}

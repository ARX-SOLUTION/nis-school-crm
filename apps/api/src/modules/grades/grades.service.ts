import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { StudentGradeSummaryDto } from '@nis/shared';
import { EVENT_GRADE_RECORDED, GradeRecordedEvent } from '../../common/events/contracts';
import { EventBusService } from '../../common/events/event-bus.service';
import { GradeResponseDto } from './dto/grade-response.dto';
import { GradesQueryDto } from './dto/grades-query.dto';
import { RecordGradeDto } from './dto/record-grade.dto';
import { GradeRecord } from './entities/grade.entity';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(GradeRecord)
    private readonly gradesRepo: Repository<GradeRecord>,
    @Optional() private readonly eventBus?: EventBusService,
  ) {}

  async recordGrade(dto: RecordGradeDto, teacherId?: string): Promise<GradeRecord> {
    const record = this.gradesRepo.create({
      studentId: dto.studentId,
      classId: dto.classId,
      subjectId: dto.subjectId,
      date: dto.date,
      score: dto.score,
      maxScore: dto.maxScore ?? 5,
      gradeType: dto.gradeType ?? 'CLASSWORK',
      comment: dto.comment ?? null,
      teacherId: teacherId ?? null,
    });
    const saved = await this.gradesRepo.save(record);

    if (this.eventBus) {
      await this.eventBus
        .publish<GradeRecordedEvent>(EVENT_GRADE_RECORDED, {
          studentId: saved.studentId,
          studentName: '',
          subjectName: '',
          score: saved.score,
          maxScore: saved.maxScore,
          gradeType: saved.gradeType,
          date: saved.date,
          comment: saved.comment,
        })
        .catch(() => {});
    }

    return saved;
  }

  async list(query?: GradesQueryDto): Promise<GradeRecord[]> {
    const qb = this.gradesRepo
      .createQueryBuilder('gr')
      .leftJoinAndSelect('gr.student', 'student')
      .leftJoinAndSelect('gr.subject', 'subject')
      .leftJoinAndSelect('gr.class', 'class');

    if (query?.classId) {
      qb.andWhere('gr.classId = :classId', { classId: query.classId });
    }
    if (query?.studentId) {
      qb.andWhere('gr.studentId = :studentId', { studentId: query.studentId });
    }
    if (query?.subjectId) {
      qb.andWhere('gr.subjectId = :subjectId', { subjectId: query.subjectId });
    }
    if (query?.date) {
      qb.andWhere('gr.date = :date', { date: query.date });
    }
    if (query?.startDate) {
      qb.andWhere('gr.date >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      qb.andWhere('gr.date <= :endDate', { endDate: query.endDate });
    }

    return qb.orderBy('gr.date', 'DESC').addOrderBy('student.lastName', 'ASC').getMany();
  }

  async getClassSubjectSummary(
    classId: string,
    subjectId: string,
  ): Promise<StudentGradeSummaryDto[]> {
    const records = await this.list({ classId, subjectId });

    // Group by student
    const map = new Map<string, { studentName: string; grades: GradeRecord[] }>();

    for (const r of records) {
      const studentName = r.student
        ? `${r.student.firstName} ${r.student.lastName}`.trim()
        : 'Unknown';
      if (!map.has(r.studentId)) {
        map.set(r.studentId, { studentName, grades: [] });
      }
      map.get(r.studentId)!.grades.push(r);
    }

    const summaries: StudentGradeSummaryDto[] = [];
    for (const [studentId, data] of map.entries()) {
      const sum = data.grades.reduce((acc, g) => acc + Number(g.score), 0);
      const avg = data.grades.length > 0 ? Number((sum / data.grades.length).toFixed(2)) : 0;
      summaries.push({
        studentId,
        studentName: data.studentName,
        grades: data.grades.map((g) => GradeResponseDto.fromEntity(g)),
        averageScore: avg,
      });
    }

    return summaries.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }
}

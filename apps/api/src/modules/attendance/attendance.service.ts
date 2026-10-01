import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AttendanceStatsDto } from '@nis/shared';
import { EVENT_ATTENDANCE_RECORDED, AttendanceRecordedEvent } from '../../common/events/contracts';
import { EventBusService } from '../../common/events/event-bus.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { BulkAttendanceRequestDto } from './dto/bulk-attendance.dto';
import { AttendanceRecord } from './entities/attendance.entity';

import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepo: Repository<AttendanceRecord>,
    @Optional() private readonly eventBus?: EventBusService,
    private readonly eventsGateway?: EventsGateway,
  ) {}

  async bulkRecord(
    dto: BulkAttendanceRequestDto,
    recordedById?: string,
  ): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = [];

    for (const item of dto.records) {
      let record = await this.attendanceRepo.findOne({
        where: { studentId: item.studentId, date: dto.date },
      });

      if (record) {
        record.status = item.status;
        record.remarks = item.remarks ?? record.remarks;
        record.recordedById = recordedById ?? record.recordedById;
      } else {
        record = this.attendanceRepo.create({
          studentId: item.studentId,
          classId: dto.classId,
          date: dto.date,
          status: item.status,
          remarks: item.remarks ?? null,
          recordedById: recordedById ?? null,
        });
      }

      const saved = await this.attendanceRepo.save(record);
      results.push(saved);

      if (this.eventBus && (item.status === 'ABSENT' || item.status === 'LATE')) {
        await this.eventBus
          .publish<AttendanceRecordedEvent>(EVENT_ATTENDANCE_RECORDED, {
            studentId: item.studentId,
            studentName: '',
            classId: dto.classId,
            date: dto.date,
            status: item.status,
            remarks: item.remarks ?? null,
          })
          .catch(() => {});
      }
      if (this.eventsGateway) {
        // Broadcast to relevant role or class (for now, globally to all parents or teachers listening)
        // Ideally we would broadcast to specific parents, but for now we broadcast to roles.
        this.eventsGateway.broadcastToRole('TEACHER', 'attendance.updated', {
          classId: dto.classId,
          studentId: item.studentId,
          date: dto.date,
        });
        this.eventsGateway.broadcastToRole('ADMIN', 'attendance.updated', {
          classId: dto.classId,
          studentId: item.studentId,
          date: dto.date,
        });
        this.eventsGateway.broadcastToRole('MANAGER', 'attendance.updated', {
          classId: dto.classId,
          studentId: item.studentId,
          date: dto.date,
        });
      }
    }

    return results;
  }

  async list(query?: AttendanceQueryDto): Promise<AttendanceRecord[]> {
    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .leftJoinAndSelect('att.class', 'class');

    if (query?.classId) {
      qb.andWhere('att.classId = :classId', { classId: query.classId });
    }
    if (query?.studentId) {
      qb.andWhere('att.studentId = :studentId', { studentId: query.studentId });
    }
    if (query?.date) {
      qb.andWhere('att.date = :date', { date: query.date });
    }
    if (query?.startDate) {
      qb.andWhere('att.date >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      qb.andWhere('att.date <= :endDate', { endDate: query.endDate });
    }

    return qb.orderBy('att.date', 'DESC').addOrderBy('student.lastName', 'ASC').getMany();
  }

  async getStats(studentId: string): Promise<AttendanceStatsDto> {
    const records = await this.attendanceRepo.find({
      where: { studentId },
    });

    const totalDays = records.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    for (const r of records) {
      if (r.status === 'PRESENT') presentCount++;
      else if (r.status === 'ABSENT') absentCount++;
      else if (r.status === 'LATE') lateCount++;
      else if (r.status === 'EXCUSED') excusedCount++;
    }

    const ratePercentage =
      totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

    return {
      totalDays,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      ratePercentage,
    };
  }
}

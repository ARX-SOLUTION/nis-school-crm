import {
  ClubCategory,
  ClubDto,
  ClubFeeType,
  ClubScheduleDto,
  ClubStatus,
  EnrollmentStatus,
  ClubEnrollmentDto,
  ClubAttendanceRecordDto,
  ClubAttendanceStatus,
} from '@nis/shared';
import { Club } from '../entities/club.entity';
import { ClubEnrollment } from '../entities/club-enrollment.entity';
import { ClubAttendance } from '../entities/club-attendance.entity';

export class ClubResponseDto {
  static fromEntity(club: Club): ClubDto {
    const schedules: ClubScheduleDto[] = (club.schedules || []).map((s) => ({
      id: s.id,
      clubId: s.clubId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      roomId: s.roomId,
      roomNumber: s.room?.roomNumber || undefined,
    }));

    const enrollments: ClubEnrollmentDto[] = (club.enrollments || []).map((e) => ({
      id: e.id,
      clubId: e.clubId,
      studentId: e.studentId,
      studentName: e.student ? `${e.student.firstName} ${e.student.lastName}` : "Noma'lum o'quvchi",
      studentCode: e.student?.studentCode || '',
      gradeLevel: e.student?.gradeLevel || 0,
      className: e.student?.class?.name || null,
      parentPhone: e.student?.parentPhone || null,
      enrolledAt: e.enrolledAt ? e.enrolledAt.toISOString() : new Date().toISOString(),
      status: e.status || EnrollmentStatus.ACTIVE,
      droppedAt: e.droppedAt ? e.droppedAt.toISOString() : null,
      dropReason: e.dropReason || null,
    }));

    const activeEnrollments = enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE);

    return {
      id: club.id,
      name: club.name,
      category: club.category as ClubCategory,
      description: club.description,
      branchId: club.branchId,
      branchName: club.branch?.name || null,
      instructorId: club.instructorId,
      instructorName: club.instructor?.fullName || club.instructorName || null,
      instructorPhone: club.instructorPhone || null,
      roomId: club.roomId,
      roomNumber: club.room?.roomNumber || null,
      capacity: club.capacity,
      enrolledCount: activeEnrollments.length,
      minGrade: club.minGrade,
      maxGrade: club.maxGrade,
      feeType: club.feeType as ClubFeeType,
      monthlyFee: Number(club.monthlyFee || 0),
      status: club.status as ClubStatus,
      schedules,
      enrollments,
      createdAt: club.createdAt.toISOString(),
      updatedAt: club.updatedAt.toISOString(),
    };
  }

  static fromEnrollment(e: ClubEnrollment): ClubEnrollmentDto {
    return {
      id: e.id,
      clubId: e.clubId,
      studentId: e.studentId,
      studentName: e.student ? `${e.student.firstName} ${e.student.lastName}` : "O'quvchi",
      studentCode: e.student?.studentCode || '',
      gradeLevel: e.student?.gradeLevel || 0,
      className: e.student?.class?.name || null,
      parentPhone: e.student?.parentPhone || null,
      enrolledAt: e.enrolledAt ? e.enrolledAt.toISOString() : new Date().toISOString(),
      status: e.status,
      droppedAt: e.droppedAt ? e.droppedAt.toISOString() : null,
      dropReason: e.dropReason || null,
    };
  }

  static fromAttendance(a: ClubAttendance): ClubAttendanceRecordDto {
    return {
      id: a.id,
      clubId: a.clubId,
      studentId: a.studentId,
      studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : undefined,
      date: a.date,
      status: a.status as ClubAttendanceStatus,
      remarks: a.remarks,
      recordedById: a.recordedById,
      recordedByName: a.recordedBy?.fullName || undefined,
    };
  }
}

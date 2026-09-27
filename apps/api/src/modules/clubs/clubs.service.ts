import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClubAttendanceStatus, ClubStatus, EnrollmentStatus, ClubStatsDto } from '@nis/shared';
import { Club } from './entities/club.entity';
import { ClubSchedule } from './entities/club-schedule.entity';
import { ClubEnrollment } from './entities/club-enrollment.entity';
import { ClubAttendance } from './entities/club-attendance.entity';
import { Student } from '../students/entities/student.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubQueryDto } from './dto/club-query.dto';
import { BulkClubAttendanceDto } from './dto/club-attendance.dto';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private readonly clubRepo: Repository<Club>,
    @InjectRepository(ClubSchedule)
    private readonly scheduleRepo: Repository<ClubSchedule>,
    @InjectRepository(ClubEnrollment)
    private readonly enrollmentRepo: Repository<ClubEnrollment>,
    @InjectRepository(ClubAttendance)
    private readonly attendanceRepo: Repository<ClubAttendance>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async findAll(query?: ClubQueryDto): Promise<Club[]> {
    const qb = this.clubRepo
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.branch', 'branch')
      .leftJoinAndSelect('club.instructor', 'instructor')
      .leftJoinAndSelect('club.room', 'room')
      .leftJoinAndSelect('club.schedules', 'schedules')
      .leftJoinAndSelect('schedules.room', 'scheduleRoom')
      .leftJoinAndSelect('club.enrollments', 'enrollments')
      .leftJoinAndSelect('enrollments.student', 'student')
      .leftJoinAndSelect('student.class', 'studentClass')
      .orderBy('club.createdAt', 'DESC');

    if (query?.category) {
      qb.andWhere('club.category = :category', { category: query.category });
    }

    if (query?.status) {
      qb.andWhere('club.status = :status', { status: query.status });
    }

    if (query?.feeType) {
      qb.andWhere('club.feeType = :feeType', { feeType: query.feeType });
    }

    if (query?.branchId) {
      qb.andWhere('club.branchId = :branchId', { branchId: query.branchId });
    }

    if (query?.search) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(club.name) LIKE :term OR LOWER(club.instructorName) LIKE :term OR LOWER(instructor.fullName) LIKE :term)',
        { term },
      );
    }

    return qb.getMany();
  }

  async findById(id: string): Promise<Club> {
    const club = await this.clubRepo
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.branch', 'branch')
      .leftJoinAndSelect('club.instructor', 'instructor')
      .leftJoinAndSelect('club.room', 'room')
      .leftJoinAndSelect('club.schedules', 'schedules')
      .leftJoinAndSelect('schedules.room', 'scheduleRoom')
      .leftJoinAndSelect('club.enrollments', 'enrollments')
      .leftJoinAndSelect('enrollments.student', 'student')
      .leftJoinAndSelect('student.class', 'studentClass')
      .where('club.id = :id', { id })
      .getOne();

    if (!club) {
      throw new NotFoundException(`To'garak topilmadi: ${id}`);
    }

    return club;
  }

  async create(dto: CreateClubDto): Promise<Club> {
    const club = this.clubRepo.create({
      name: dto.name,
      category: dto.category,
      description: dto.description || null,
      branchId: dto.branchId || null,
      instructorId: dto.instructorId || null,
      instructorName: dto.instructorName || null,
      instructorPhone: dto.instructorPhone || null,
      roomId: dto.roomId || null,
      capacity: dto.capacity,
      minGrade: dto.minGrade ?? 1,
      maxGrade: dto.maxGrade ?? 11,
      feeType: dto.feeType || undefined,
      monthlyFee: dto.monthlyFee ?? 0,
      status: ClubStatus.ACTIVE,
    });

    const savedClub = await this.clubRepo.save(club);

    if (dto.schedules && dto.schedules.length > 0) {
      const schedules = dto.schedules.map((s) =>
        this.scheduleRepo.create({
          clubId: savedClub.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          roomId: s.roomId || savedClub.roomId || null,
        }),
      );
      await this.scheduleRepo.save(schedules);
    }

    return this.findById(savedClub.id);
  }

  async update(id: string, dto: UpdateClubDto): Promise<Club> {
    const club = await this.findById(id);

    if (dto.name !== undefined) club.name = dto.name;
    if (dto.category !== undefined) club.category = dto.category;
    if (dto.description !== undefined) club.description = dto.description;
    if (dto.branchId !== undefined) club.branchId = dto.branchId;
    if (dto.instructorId !== undefined) club.instructorId = dto.instructorId;
    if (dto.instructorName !== undefined) club.instructorName = dto.instructorName;
    if (dto.instructorPhone !== undefined) club.instructorPhone = dto.instructorPhone;
    if (dto.roomId !== undefined) club.roomId = dto.roomId;
    if (dto.capacity !== undefined) club.capacity = dto.capacity;
    if (dto.minGrade !== undefined) club.minGrade = dto.minGrade;
    if (dto.maxGrade !== undefined) club.maxGrade = dto.maxGrade;
    if (dto.feeType !== undefined) club.feeType = dto.feeType;
    if (dto.monthlyFee !== undefined) club.monthlyFee = dto.monthlyFee;
    if (dto.status !== undefined) club.status = dto.status;

    await this.clubRepo.save(club);

    if (dto.schedules !== undefined) {
      await this.scheduleRepo.delete({ clubId: id });
      if (dto.schedules.length > 0) {
        const schedules = dto.schedules.map((s) =>
          this.scheduleRepo.create({
            clubId: id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            roomId: s.roomId || club.roomId || null,
          }),
        );
        await this.scheduleRepo.save(schedules);
      }
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const club = await this.findById(id);
    club.status = ClubStatus.ARCHIVED;
    await this.clubRepo.save(club);
  }

  async enrollStudent(clubId: string, studentId: string): Promise<ClubEnrollment> {
    const club = await this.findById(clubId);
    if (club.status !== ClubStatus.ACTIVE) {
      throw new BadRequestException("Ushbu to'garak faol emas");
    }

    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['class'],
    });
    if (!student) {
      throw new NotFoundException(`O'quvchi topilmadi: ${studentId}`);
    }

    // Check student grade level
    if (
      student.gradeLevel &&
      (student.gradeLevel < club.minGrade || student.gradeLevel > club.maxGrade)
    ) {
      throw new BadRequestException(
        `O'quvchi sinfi (${student.gradeLevel}-sinf) ushbu to'garak talabiga (${club.minGrade}-${club.maxGrade} sinflar) to'g'ri kelmaydi`,
      );
    }

    // Check existing active enrollment
    const existing = await this.enrollmentRepo.findOne({
      where: { clubId, studentId, status: EnrollmentStatus.ACTIVE },
    });
    if (existing) {
      throw new ConflictException("Ushbu o'quvchi mazkur to'garakka allaqachon a'zo bo'lgan");
    }

    // Check capacity
    const activeCount = await this.enrollmentRepo.count({
      where: { clubId, status: EnrollmentStatus.ACTIVE },
    });
    if (activeCount >= club.capacity) {
      throw new BadRequestException(
        `To'garakda bo'sh o'rin qolmagan. Maksimal sig'im: ${club.capacity} nafar`,
      );
    }

    const enrollment = this.enrollmentRepo.create({
      clubId,
      studentId,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: new Date(),
    });

    const saved = await this.enrollmentRepo.save(enrollment);
    saved.student = student;
    return saved;
  }

  async dropStudent(clubId: string, studentId: string, reason?: string): Promise<ClubEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { clubId, studentId, status: EnrollmentStatus.ACTIVE },
      relations: ['student'],
    });

    if (!enrollment) {
      throw new NotFoundException("Faol a'zolik topilmadi");
    }

    enrollment.status = EnrollmentStatus.DROPPED;
    enrollment.droppedAt = new Date();
    enrollment.dropReason = reason || "O'quvchi to'garakdan chiqdi";

    return this.enrollmentRepo.save(enrollment);
  }

  async recordAttendance(
    clubId: string,
    dto: BulkClubAttendanceDto,
    recordedById?: string,
  ): Promise<ClubAttendance[]> {
    const club = await this.findById(clubId);

    const savedRecords: ClubAttendance[] = [];

    for (const rec of dto.records) {
      let existing = await this.attendanceRepo.findOne({
        where: { clubId: club.id, studentId: rec.studentId, date: dto.date },
      });

      if (existing) {
        existing.status = rec.status;
        existing.remarks = rec.remarks || null;
        if (recordedById) existing.recordedById = recordedById;
        savedRecords.push(await this.attendanceRepo.save(existing));
      } else {
        const item = this.attendanceRepo.create({
          clubId: club.id,
          studentId: rec.studentId,
          date: dto.date,
          status: rec.status,
          remarks: rec.remarks || null,
          recordedById: recordedById || null,
        });
        savedRecords.push(await this.attendanceRepo.save(item));
      }
    }

    return savedRecords;
  }

  async getAttendanceHistory(clubId: string, date?: string): Promise<ClubAttendance[]> {
    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .leftJoinAndSelect('att.recordedBy', 'recordedBy')
      .where('att.clubId = :clubId', { clubId })
      .orderBy('att.date', 'DESC');

    if (date) {
      qb.andWhere('att.date = :date', { date });
    }

    return qb.getMany();
  }

  async getStats(): Promise<ClubStatsDto> {
    const totalClubs = await this.clubRepo.count();
    const activeClubs = await this.clubRepo.count({ where: { status: ClubStatus.ACTIVE } });
    const totalEnrolled = await this.enrollmentRepo.count({
      where: { status: EnrollmentStatus.ACTIVE },
    });

    // Hafta kuni bo'yicha bugungi mashg'ulotlar soni
    const today = new Date();
    const jsDay = today.getDay(); // 0 = Yakshanba, 1 = Dushanba ... 6 = Shanba
    const todayDayOfWeek = jsDay === 0 ? 7 : jsDay;

    const todaySessionsCount = await this.scheduleRepo.count({
      where: { dayOfWeek: todayDayOfWeek },
    });

    // Qatnashish foizi
    const totalAttendanceCount = await this.attendanceRepo.count();
    const presentAttendanceCount = await this.attendanceRepo.count({
      where: { status: ClubAttendanceStatus.PRESENT },
    });

    const averageAttendanceRate =
      totalAttendanceCount > 0
        ? Math.round((presentAttendanceCount / totalAttendanceCount) * 100)
        : 95;

    return {
      totalClubs,
      activeClubs,
      totalEnrolled,
      todaySessionsCount,
      averageAttendanceRate,
    };
  }

  async checkConflicts(
    roomId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeClubId?: string,
  ): Promise<{ hasConflict: boolean; message?: string }> {
    const qb = this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.club', 'club')
      .leftJoinAndSelect('s.room', 'room')
      .where('s.roomId = :roomId', { roomId })
      .andWhere('s.dayOfWeek = :dayOfWeek', { dayOfWeek });

    if (excludeClubId) {
      qb.andWhere('s.clubId != :excludeClubId', { excludeClubId });
    }

    const schedules = await qb.getMany();

    for (const item of schedules) {
      // Vaqt to'qnashuvi sharti: max(start1, start2) < min(end1, end2)
      if (startTime < item.endTime && item.startTime < endTime) {
        return {
          hasConflict: true,
          message: `Xona band: "${item.club?.name || "Boshqa to'garak"}" mashg'uloti bilan vaqt to'qnashuvi (${item.startTime} - ${item.endTime})`,
        };
      }
    }

    return { hasConflict: false };
  }
}

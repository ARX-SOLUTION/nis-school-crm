import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateScheduleEntryDto } from './dto/create-schedule-entry.dto';
import { CreateSubstitutionDto } from './dto/create-substitution.dto';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { UpdateScheduleEntryDto } from './dto/update-schedule-entry.dto';
import { ScheduleEntry } from './entities/schedule-entry.entity';
import { ScheduleSubstitution } from './entities/schedule-substitution.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleEntry)
    private readonly entryRepo: Repository<ScheduleEntry>,
    @InjectRepository(ScheduleSubstitution)
    private readonly subRepo: Repository<ScheduleSubstitution>,
  ) {}

  async list(query?: ScheduleQueryDto): Promise<ScheduleEntry[]> {
    const qb = this.entryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.class', 'class')
      .leftJoinAndSelect('entry.subject', 'subject')
      .leftJoinAndSelect('entry.teacher', 'teacher')
      .leftJoinAndSelect('entry.room', 'room')
      .leftJoinAndSelect('entry.substitutions', 'substitutions');

    if (query?.classId) {
      qb.andWhere('entry.classId = :classId', { classId: query.classId });
    }
    if (query?.teacherId) {
      qb.andWhere('entry.teacherId = :teacherId', { teacherId: query.teacherId });
    }
    if (query?.roomId) {
      qb.andWhere('entry.roomId = :roomId', { roomId: query.roomId });
    }
    if (query?.dayOfWeek) {
      qb.andWhere('entry.dayOfWeek = :dayOfWeek', { dayOfWeek: query.dayOfWeek });
    }
    if (query?.isActive !== undefined) {
      qb.andWhere('entry.isActive = :isActive', { isActive: query.isActive });
    }

    return qb.orderBy('entry.dayOfWeek', 'ASC').addOrderBy('entry.lessonNumber', 'ASC').getMany();
  }

  async getById(id: string): Promise<ScheduleEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id },
      relations: ['class', 'subject', 'teacher', 'room', 'substitutions'],
    });
    if (!entry) {
      throw new NotFoundException(`Schedule entry with id ${id} not found`);
    }
    return entry;
  }

  async create(dto: CreateScheduleEntryDto): Promise<ScheduleEntry> {
    await this.validateConflicts(dto);

    const entry = this.entryRepo.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return this.entryRepo.save(entry);
  }

  async update(id: string, dto: UpdateScheduleEntryDto): Promise<ScheduleEntry> {
    const existing = await this.getById(id);
    const merged = { ...existing, ...dto };

    await this.validateConflicts(merged, id);

    Object.assign(existing, dto);
    return this.entryRepo.save(existing);
  }

  async softDelete(id: string): Promise<void> {
    const entry = await this.getById(id);
    await this.entryRepo.softRemove(entry);
  }

  async createSubstitution(
    dto: CreateSubstitutionDto,
    creatorUserId?: string,
  ): Promise<ScheduleSubstitution> {
    const original = await this.getById(dto.originalEntryId);

    // Check duplicate substitution on same date
    const existing = await this.subRepo.findOne({
      where: { originalEntryId: original.id, date: dto.date },
    });
    if (existing && existing.status === 'CONFIRMED') {
      throw new ConflictException(
        `A confirmed substitution already exists for this lesson on ${dto.date}`,
      );
    }

    const sub = this.subRepo.create({
      originalEntryId: original.id,
      substituteTeacherId: dto.substituteTeacherId,
      date: dto.date,
      reason: dto.reason ?? null,
      status: 'CONFIRMED',
      createdById: creatorUserId ?? null,
    });
    return this.subRepo.save(sub);
  }

  async listSubstitutions(date?: string): Promise<ScheduleSubstitution[]> {
    const qb = this.subRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.originalEntry', 'entry')
      .leftJoinAndSelect('sub.substituteTeacher', 'substituteTeacher')
      .leftJoinAndSelect('entry.subject', 'subject')
      .leftJoinAndSelect('entry.class', 'class');

    if (date) {
      qb.andWhere('sub.date = :date', { date });
    }

    return qb.orderBy('sub.date', 'DESC').getMany();
  }

  async cancelSubstitution(id: string): Promise<ScheduleSubstitution> {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) {
      throw new NotFoundException(`Substitution with id ${id} not found`);
    }
    sub.status = 'CANCELLED';
    return this.subRepo.save(sub);
  }

  private async validateConflicts(
    dto: {
      classId: string;
      teacherId: string;
      roomId: string;
      dayOfWeek: string;
      lessonNumber: number;
    },
    excludeId?: string,
  ): Promise<void> {
    // 1. Room conflict
    const roomConflict = await this.entryRepo
      .createQueryBuilder('entry')
      .where('entry.roomId = :roomId', { roomId: dto.roomId })
      .andWhere('entry.dayOfWeek = :dayOfWeek', { dayOfWeek: dto.dayOfWeek })
      .andWhere('entry.lessonNumber = :lessonNumber', { lessonNumber: dto.lessonNumber })
      .andWhere('entry.isActive = true')
      .andWhere(excludeId ? 'entry.id != :excludeId' : '1=1', { excludeId })
      .getOne();

    if (roomConflict) {
      throw new ConflictException('Room is already occupied for this period on this day');
    }

    // 2. Teacher conflict
    const teacherConflict = await this.entryRepo
      .createQueryBuilder('entry')
      .where('entry.teacherId = :teacherId', { teacherId: dto.teacherId })
      .andWhere('entry.dayOfWeek = :dayOfWeek', { dayOfWeek: dto.dayOfWeek })
      .andWhere('entry.lessonNumber = :lessonNumber', { lessonNumber: dto.lessonNumber })
      .andWhere('entry.isActive = true')
      .andWhere(excludeId ? 'entry.id != :excludeId' : '1=1', { excludeId })
      .getOne();

    if (teacherConflict) {
      throw new ConflictException(
        'Teacher is already scheduled for another class during this period',
      );
    }

    // 3. Class conflict
    const classConflict = await this.entryRepo
      .createQueryBuilder('entry')
      .where('entry.classId = :classId', { classId: dto.classId })
      .andWhere('entry.dayOfWeek = :dayOfWeek', { dayOfWeek: dto.dayOfWeek })
      .andWhere('entry.lessonNumber = :lessonNumber', { lessonNumber: dto.lessonNumber })
      .andWhere('entry.isActive = true')
      .andWhere(excludeId ? 'entry.id != :excludeId' : '1=1', { excludeId })
      .getOne();

    if (classConflict) {
      throw new ConflictException('Class already has a scheduled lesson during this period');
    }
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { LeadDto, LeadPipelineStatsDto, LeadStage } from '@nis/shared';
import { Student, StudentGender, StudentStatus } from '../students/entities/student.entity';
import { StudentCodeService } from '../students/services/student-code.service';
import { ConvertToStudentDto } from './dto/convert-to-student.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsQueryDto } from './dto/leads-query.dto';
import { UpdateLeadStageDto } from './dto/update-lead-stage.dto';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly studentCodeService: StudentCodeService,
  ) {}

  private toDto(lead: Lead): LeadDto {
    return {
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      parentName: lead.parentName,
      targetGradeLevel: lead.targetGradeLevel,
      source: lead.source,
      stage: lead.stage,
      notes: lead.notes,
      convertedStudentId: lead.convertedStudentId,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  async create(dto: CreateLeadDto): Promise<LeadDto> {
    const lead = this.leadRepo.create({
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      parentName: dto.parentName?.trim() ?? null,
      targetGradeLevel: dto.targetGradeLevel ?? null,
      source: dto.source ?? 'TELEGRAM',
      stage: 'NEW',
      notes: dto.notes?.trim() ?? null,
    });

    const saved = await this.leadRepo.save(lead);
    return this.toDto(saved);
  }

  async findAll(query: LeadsQueryDto): Promise<LeadDto[]> {
    const qb = this.leadRepo.createQueryBuilder('l');

    if (query.stage) {
      qb.andWhere('l.stage = :stage', { stage: query.stage });
    }
    if (query.source) {
      qb.andWhere('l.source = :source', { source: query.source });
    }
    if (query.search) {
      qb.andWhere(
        '(LOWER(l.fullName) LIKE :search OR l.phone LIKE :search OR LOWER(l.parentName) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('l.createdAt', 'DESC');
    const items = await qb.getMany();
    return items.map((l) => this.toDto(l));
  }

  async findOne(id: string): Promise<LeadDto> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with id ${id} not found`);
    }
    return this.toDto(lead);
  }

  async updateStage(id: string, dto: UpdateLeadStageDto): Promise<LeadDto> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with id ${id} not found`);
    }

    lead.stage = dto.stage;
    if (dto.notes) {
      lead.notes = lead.notes
        ? `${lead.notes}\n[${new Date().toLocaleDateString('uz-UZ')}]: ${dto.notes}`
        : dto.notes;
    }

    const saved = await this.leadRepo.save(lead);
    return this.toDto(saved);
  }

  async convertToStudent(
    id: string,
    dto: ConvertToStudentDto,
  ): Promise<{ lead: LeadDto; studentId: string }> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with id ${id} not found`);
    }
    if (lead.convertedStudentId) {
      throw new BadRequestException("Bu nomzod allaqachon o'quvchiga aylantirilgan");
    }

    // Split name: "Karimov Shaxzod Olimovich"
    const parts = lead.fullName.trim().split(/\s+/);
    let lastName = parts[0] || 'Familiya';
    let firstName = parts[1] || parts[0];
    let middleName: string | null = parts.length > 2 ? parts.slice(2).join(' ') : null;

    if (parts.length === 1) {
      firstName = parts[0];
      lastName = '-';
      middleName = null;
    }

    const currentYear = new Date().getFullYear();
    const studentCode = await this.studentCodeService.next(currentYear);

    const student = this.studentRepo.create({
      studentCode,
      firstName,
      lastName,
      middleName,
      birthDate: dto.birthDate || '2015-01-01',
      gender: dto.gender ? (dto.gender as StudentGender) : StudentGender.MALE,
      gradeLevel: lead.targetGradeLevel ?? 1,
      classId: dto.classId ?? null,
      status: StudentStatus.ACTIVE,
      parentFullName: lead.parentName ?? null,
      parentPhone: lead.phone,
      enrolledAt: new Date().toISOString(),
    });

    const savedStudent = await this.studentRepo.save(student);

    lead.stage = 'ENROLLED';
    lead.convertedStudentId = savedStudent.id;
    const savedLead = await this.leadRepo.save(lead);

    return {
      lead: this.toDto(savedLead),
      studentId: savedStudent.id,
    };
  }

  async getStats(): Promise<LeadPipelineStatsDto> {
    const counts = await this.leadRepo
      .createQueryBuilder('l')
      .select('l.stage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('l.stage')
      .getRawMany();

    const byStage: Record<LeadStage, number> = {
      NEW: 0,
      CONTACTED: 0,
      TRIAL_SCHEDULED: 0,
      CONTRACT_SENT: 0,
      ENROLLED: 0,
      LOST: 0,
    };

    let total = 0;
    for (const row of counts) {
      const stage = row.stage as LeadStage;
      const count = Number(row.count);
      if (byStage[stage] !== undefined) {
        byStage[stage] = count;
      }
      total += count;
    }

    const enrolled = byStage.ENROLLED ?? 0;
    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0;

    return {
      total,
      byStage,
      conversionRate,
    };
  }

  async delete(id: string): Promise<void> {
    const result = await this.leadRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Lead with id ${id} not found`);
    }
  }
}

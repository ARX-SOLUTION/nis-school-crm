import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Branch } from './entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
  ) {}

  async findAll(onlyActive = false): Promise<Branch[]> {
    const qb = this.branchRepo.createQueryBuilder('b').orderBy('b.createdAt', 'ASC');
    if (onlyActive) {
      qb.where('b.isActive = :active', { active: true });
    }
    return qb.getMany();
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }
    return branch;
  }

  async create(dto: CreateBranchDto): Promise<Branch> {
    const existing = await this.branchRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Branch code ${dto.code} already exists`);
    }

    const branch = this.branchRepo.create({
      name: dto.name,
      code: dto.code,
      address: dto.address ?? null,
      phone: dto.phone ?? null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.branchRepo.save(branch);
  }

  async update(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);

    if (dto.code && dto.code !== branch.code) {
      const existing = await this.branchRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Branch code ${dto.code} already exists`);
      }
      branch.code = dto.code;
    }

    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.address !== undefined) branch.address = dto.address;
    if (dto.phone !== undefined) branch.phone = dto.phone;
    if (dto.isActive !== undefined) branch.isActive = dto.isActive;

    return this.branchRepo.save(branch);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    branch.isActive = false;
    await this.branchRepo.save(branch);
  }

  async getStats(id: string) {
    await this.findOne(id);

    const activeStudents = await this.studentRepo.count({
      where: {
        status: StudentStatus.ACTIVE,
        // @ts-expect-error branch_id in db
        branchId: id,
      },
    });

    const classesCount = await this.classRepo.count({
      where: {
        // @ts-expect-error branch_id in db
        branchId: id,
      },
    });

    return {
      activeStudents,
      classesCount,
    };
  }
}

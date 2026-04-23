import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { ActorContext } from '../../common/types/actor-context';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherProfile } from './entities/teacher-profile.entity';

export interface CreatedTeacherResult {
  profile: TeacherProfile;
  generatedPassword: string;
}

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(TeacherProfile)
    private readonly profiles: Repository<TeacherProfile>,
    private readonly users: UsersService,
  ) {}

  /**
   * Create a User (role=TEACHER) and the matching TeacherProfile in a single
   * transaction. The transaction is owned by UsersService.create — we pass
   * an `extra` callback that runs against the same EntityManager.
   */
  async create(actor: ActorContext, dto: CreateTeacherDto): Promise<CreatedTeacherResult> {
    const userDto: CreateUserDto = {
      email: dto.email,
      fullName: dto.fullName,
      role: RoleName.TEACHER,
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.telegramUsername !== undefined ? { telegramUsername: dto.telegramUsername } : {}),
    };

    let createdProfile: TeacherProfile | undefined;
    const result = await this.users.create(actor, userDto, async (manager, user) => {
      const repo = manager.getRepository(TeacherProfile);
      createdProfile = await repo.save(
        repo.create({
          userId: user.id,
          subject: dto.subject ?? null,
          experienceYears: dto.experienceYears ?? 0,
          education: dto.education ?? null,
          bio: null,
        }),
      );
    });

    if (!createdProfile) {
      throw new Error('TeacherProfile was not persisted');
    }
    createdProfile.user = result.user;
    return { profile: createdProfile, generatedPassword: result.generatedPassword };
  }

  async findByUserId(userId: string): Promise<TeacherProfile> {
    const profile = await this.profiles.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return profile;
  }
}

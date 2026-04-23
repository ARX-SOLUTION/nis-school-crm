import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { RoleName } from '../../common/enums/role.enum';
import { ClassResponseDto } from '../classes/dto/class-response.dto';
import { ClassesService } from '../classes/classes.service';
import { StudentResponseDto } from '../students/dto/student-response.dto';
import { StudentsService } from '../students/students.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherResponseDto } from './dto/teacher-response.dto';
import { TeachersService } from './teachers.service';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller({ path: 'teachers', version: ['1'] })
export class TeachersController {
  constructor(
    private readonly teachers: TeachersService,
    private readonly classes: ClassesService,
    private readonly students: StudentsService,
  ) {}

  @Post()
  @Roles(RoleName.MANAGER)
  @ApiOperation({
    summary: 'Provision a teacher (User + TeacherProfile in one transaction)',
  })
  async create(
    @Body() dto: CreateTeacherDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TeacherResponseDto> {
    const result = await this.teachers.create({ id: actor.id, role: actor.role }, dto);
    return TeacherResponseDto.fromEntities(result.profile.user, result.profile);
  }

  // --- Teacher self-serve ---
  // RolesGuard hierarchy lets higher roles pass @Roles(TEACHER), but these
  // endpoints are semantically TEACHER-only. We enforce the exact role at
  // runtime so an ADMIN/MANAGER hitting /me doesn't silently get an empty
  // (misleading) response.

  @Get('me/class')
  @Roles(RoleName.TEACHER)
  @ApiOperation({ summary: 'The class the caller is the class teacher of (if any)' })
  async myClass(@CurrentUser() actor: AuthenticatedUser): Promise<ClassResponseDto | null> {
    assertExactlyTeacher(actor);
    const klass = await this.classes.findByTeacher(actor.id);
    return klass ? ClassResponseDto.fromEntity(klass) : null;
  }

  @Get('me/students')
  @Roles(RoleName.TEACHER)
  @ApiOperation({ summary: 'Students in the class the caller teaches (read-only)' })
  async myStudents(@CurrentUser() actor: AuthenticatedUser): Promise<StudentResponseDto[]> {
    assertExactlyTeacher(actor);
    const list = await this.students.findForTeacher(actor.id);
    return list.map((s) => StudentResponseDto.fromEntity(s));
  }

  @Get(':userId')
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Look up a teacher profile by user id' })
  async findByUserId(@Param('userId', ParseUUIDPipe) userId: string): Promise<TeacherResponseDto> {
    const profile = await this.teachers.findByUserId(userId);
    return TeacherResponseDto.fromEntities(profile.user, profile);
  }
}

function assertExactlyTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== RoleName.TEACHER) {
    throw new ForbiddenException('This endpoint is for teachers only');
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { RoleName } from '../../common/enums/role.enum';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherResponseDto } from './dto/teacher-response.dto';
import { TeachersService } from './teachers.service';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller({ path: 'teachers', version: ['1'] })
export class TeachersController {
  constructor(private readonly teachers: TeachersService) {}

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

  @Get(':userId')
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Look up a teacher profile by user id' })
  async findByUserId(@Param('userId', ParseUUIDPipe) userId: string): Promise<TeacherResponseDto> {
    const profile = await this.teachers.findByUserId(userId);
    return TeacherResponseDto.fromEntities(profile.user, profile);
  }
}

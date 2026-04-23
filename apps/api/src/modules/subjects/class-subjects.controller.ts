import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RoleName } from '../../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ClassSubjectsService } from './class-subjects.service';
import { AssignSubjectDto } from './dto/assign-subject.dto';
import { ClassSubjectResponseDto } from './dto/class-subject-response.dto';
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto';

@ApiTags('Classes / Subjects')
@ApiBearerAuth()
@Controller({ path: 'classes/:classId/subjects', version: ['1'] })
export class ClassSubjectsController {
  constructor(private readonly classSubjects: ClassSubjectsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiParam({ name: 'classId', format: 'uuid' })
  @ApiOperation({ summary: 'Assign a subject (with teacher) to a class for an academic year' })
  @ApiResponse({ status: 201, type: ClassSubjectResponseDto })
  async assign(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: AssignSubjectDto,
  ): Promise<ClassSubjectResponseDto> {
    const row = await this.classSubjects.assign(classId, dto);
    return ClassSubjectResponseDto.fromEntity(row);
  }

  @Get()
  @ApiParam({ name: 'classId', format: 'uuid' })
  @ApiOperation({
    summary:
      'List subjects assigned to a class. TEACHER role sees only rows where they are the assigned teacher.',
  })
  @ApiResponse({ status: 200, type: [ClassSubjectResponseDto] })
  async list(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Req() req: Request & { user?: AuthenticatedUser },
  ): Promise<ClassSubjectResponseDto[]> {
    const caller = req.user as AuthenticatedUser;
    const rows = await this.classSubjects.list(classId, caller);
    return rows.map((r) => ClassSubjectResponseDto.fromEntity(r));
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiParam({ name: 'classId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ClassSubject assignment UUID' })
  @ApiOperation({ summary: 'Update teacher or hours for a class+subject assignment' })
  @ApiResponse({ status: 200, type: ClassSubjectResponseDto })
  async update(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassSubjectDto,
  ): Promise<ClassSubjectResponseDto> {
    const row = await this.classSubjects.update(classId, id, dto);
    return ClassSubjectResponseDto.fromEntity(row);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiParam({ name: 'classId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ClassSubject assignment UUID' })
  @ApiOperation({ summary: 'Hard-delete a class+subject assignment (no history preserved)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.classSubjects.remove(classId, id);
  }
}

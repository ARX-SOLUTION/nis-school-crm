import { Body, Controller, Get, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { StudentGradeSummaryDto } from '@nis/shared';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { GradeResponseDto } from './dto/grade-response.dto';
import { GradesQueryDto } from './dto/grades-query.dto';
import { RecordGradeDto } from './dto/record-grade.dto';
import { GradesService } from './grades.service';

@ApiTags('Grades')
@ApiBearerAuth()
@Controller({ path: 'grades', version: ['1'] })
export class GradesController {
  constructor(private readonly grades: GradesService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.TEACHER)
  @ApiOperation({ summary: 'Record a grade for a student' })
  @ApiResponse({ status: 201, type: GradeResponseDto })
  async recordGrade(
    @Body() dto: RecordGradeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GradeResponseDto> {
    const record = await this.grades.recordGrade(dto, user.id);
    return GradeResponseDto.fromEntity(record);
  }

  @Get()
  @ApiOperation({ summary: 'List grades filtered by class, student, or subject' })
  @ApiResponse({ status: 200, type: [GradeResponseDto] })
  async list(@Query() query: GradesQueryDto): Promise<GradeResponseDto[]> {
    const records = await this.grades.list(query);
    return records.map((r) => GradeResponseDto.fromEntity(r));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get grade summary and average score for a class and subject' })
  @ApiResponse({ status: 200 })
  async getSummary(
    @Query('classId', ParseUUIDPipe) classId: string,
    @Query('subjectId', ParseUUIDPipe) subjectId: string,
  ): Promise<StudentGradeSummaryDto[]> {
    return this.grades.getClassSubjectSummary(classId, subjectId);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  AttendanceReportQueryDto,
  FinanceReportQueryDto,
  GradesReportQueryDto,
} from '@nis/shared';
import { RoleName } from '../../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller({ path: 'reports', version: ['1'] })
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('attendance')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Monthly attendance report by class' })
  @ApiQuery({ name: 'month', required: false, example: '2026-09' })
  @ApiQuery({ name: 'classId', required: false })
  async attendance(@Query() query: AttendanceReportQueryDto) {
    return this.reports.getAttendanceReport(query);
  }

  @Get('grades')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Grades report: subject averages and top 10 students' })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  async grades(@Query() query: GradesReportQueryDto) {
    return this.reports.getGradesReport(query);
  }

  @Get('finance')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Monthly finance report: revenue trend for last N months' })
  @ApiQuery({ name: 'months', required: false, example: 6 })
  async finance(@Query() query: FinanceReportQueryDto) {
    return this.reports.getFinanceReport(query);
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AttendanceStatsDto } from '@nis/shared';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { BulkAttendanceRequestDto } from './dto/bulk-attendance.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller({ path: 'attendance', version: ['1'] })
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('bulk')
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.TEACHER)
  @ApiOperation({ summary: 'Bulk record student attendance for a class on a date' })
  @ApiResponse({ status: 201, type: [AttendanceResponseDto] })
  async bulkRecord(
    @Body() dto: BulkAttendanceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AttendanceResponseDto[]> {
    const records = await this.attendance.bulkRecord(dto, user.id);
    return records.map((r) => AttendanceResponseDto.fromEntity(r));
  }

  @Get()
  @ApiOperation({ summary: 'List attendance records filtered by class, student, or date' })
  @ApiResponse({ status: 200, type: [AttendanceResponseDto] })
  async list(@Query() query: AttendanceQueryDto): Promise<AttendanceResponseDto[]> {
    const records = await this.attendance.list(query);
    return records.map((r) => AttendanceResponseDto.fromEntity(r));
  }

  @Get('stats/:studentId')
  @ApiOperation({ summary: 'Get student attendance summary statistics' })
  @ApiResponse({ status: 200 })
  async getStats(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<AttendanceStatsDto> {
    return this.attendance.getStats(studentId);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClubDto, ClubEnrollmentDto, ClubAttendanceRecordDto, ClubStatsDto } from '@nis/shared';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubQueryDto } from './dto/club-query.dto';
import { BulkClubAttendanceDto, EnrollStudentDto } from './dto/club-attendance.dto';
import { ClubResponseDto } from './dto/club-response.dto';

@ApiTags('Clubs')
@ApiBearerAuth()
@Controller({ path: 'clubs', version: ['1'] })
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clubs with filters' })
  @ApiResponse({ status: 200 })
  async list(@Query() query: ClubQueryDto): Promise<ClubDto[]> {
    const clubs = await this.clubsService.findAll(query);
    return clubs.map((c) => ClubResponseDto.fromEntity(c));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get summary statistics of clubs' })
  @ApiResponse({ status: 200 })
  async getStats(): Promise<ClubStatsDto> {
    return this.clubsService.getStats();
  }

  @Get('conflicts/check')
  @ApiOperation({ summary: 'Check schedule and room conflicts' })
  @ApiResponse({ status: 200 })
  async checkConflict(
    @Query('roomId', ParseUUIDPipe) roomId: string,
    @Query('dayOfWeek', ParseIntPipe) dayOfWeek: number,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('excludeClubId') excludeClubId?: string,
  ): Promise<{ hasConflict: boolean; message?: string }> {
    return this.clubsService.checkConflicts(roomId, dayOfWeek, startTime, endTime, excludeClubId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club details by ID' })
  @ApiResponse({ status: 200 })
  async getOne(@Param('id', ParseUUIDPipe) id: string): Promise<ClubDto> {
    const club = await this.clubsService.findById(id);
    return ClubResponseDto.fromEntity(club);
  }

  @Post()
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Create a new club' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateClubDto): Promise<ClubDto> {
    const club = await this.clubsService.create(dto);
    return ClubResponseDto.fromEntity(club);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Update club details' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClubDto,
  ): Promise<ClubDto> {
    const club = await this.clubsService.update(id, dto);
    return ClubResponseDto.fromEntity(club);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Archive a club' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.clubsService.remove(id);
  }

  @Post(':id/enroll')
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.TEACHER)
  @ApiOperation({ summary: 'Enroll a student into a club' })
  @ApiResponse({ status: 201 })
  async enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnrollStudentDto,
  ): Promise<ClubEnrollmentDto> {
    const enrollment = await this.clubsService.enrollStudent(id, dto.studentId);
    return ClubResponseDto.fromEnrollment(enrollment);
  }

  @Delete(':id/enroll/:studentId')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Drop a student from a club' })
  @ApiResponse({ status: 200 })
  async drop(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<ClubEnrollmentDto> {
    const enrollment = await this.clubsService.dropStudent(id, studentId);
    return ClubResponseDto.fromEnrollment(enrollment);
  }

  @Post(':id/attendance')
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.TEACHER)
  @ApiOperation({ summary: 'Bulk record club attendance for a date' })
  @ApiResponse({ status: 201 })
  async recordAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BulkClubAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClubAttendanceRecordDto[]> {
    const records = await this.clubsService.recordAttendance(id, dto, user.id);
    return records.map((r) => ClubResponseDto.fromAttendance(r));
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get club attendance records' })
  @ApiResponse({ status: 200 })
  async getAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date?: string,
  ): Promise<ClubAttendanceRecordDto[]> {
    const records = await this.clubsService.getAttendanceHistory(id, date);
    return records.map((r) => ClubResponseDto.fromAttendance(r));
  }
}

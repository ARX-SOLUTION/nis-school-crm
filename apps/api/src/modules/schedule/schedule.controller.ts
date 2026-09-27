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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateScheduleEntryDto } from './dto/create-schedule-entry.dto';
import { CreateSubstitutionDto } from './dto/create-substitution.dto';
import { ScheduleEntryResponseDto } from './dto/schedule-entry-response.dto';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { ScheduleSubstitutionResponseDto } from './dto/schedule-substitution-response.dto';
import { UpdateScheduleEntryDto } from './dto/update-schedule-entry.dto';
import { ScheduleService } from './schedule.service';

@ApiTags('Schedule')
@ApiBearerAuth()
@Controller({ path: 'schedule', version: ['1'] })
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Create a schedule entry' })
  @ApiResponse({ status: 201, type: ScheduleEntryResponseDto })
  async create(@Body() dto: CreateScheduleEntryDto): Promise<ScheduleEntryResponseDto> {
    const entry = await this.schedule.create(dto);
    return ScheduleEntryResponseDto.fromEntity(entry);
  }

  @Get()
  @ApiOperation({
    summary: 'List schedule entries (filterable by class, teacher, room, dayOfWeek, active)',
  })
  @ApiResponse({ status: 200, type: [ScheduleEntryResponseDto] })
  async list(@Query() query: ScheduleQueryDto): Promise<ScheduleEntryResponseDto[]> {
    const entries = await this.schedule.list(query);
    return entries.map((e) => ScheduleEntryResponseDto.fromEntity(e));
  }

  @Post('substitutions')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Create a lesson substitution' })
  @ApiResponse({ status: 201, type: ScheduleSubstitutionResponseDto })
  async createSubstitution(
    @Body() dto: CreateSubstitutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ScheduleSubstitutionResponseDto> {
    const sub = await this.schedule.createSubstitution(dto, user.id);
    return ScheduleSubstitutionResponseDto.fromEntity(sub);
  }

  @Get('substitutions')
  @ApiOperation({ summary: 'List schedule substitutions' })
  @ApiResponse({ status: 200, type: [ScheduleSubstitutionResponseDto] })
  async listSubstitutions(
    @Query('date') date?: string,
  ): Promise<ScheduleSubstitutionResponseDto[]> {
    const subs = await this.schedule.listSubstitutions(date);
    return subs.map((s) => ScheduleSubstitutionResponseDto.fromEntity(s));
  }

  @Patch('substitutions/:id/cancel')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Cancel a schedule substitution' })
  @ApiResponse({ status: 200, type: ScheduleSubstitutionResponseDto })
  async cancelSubstitution(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScheduleSubstitutionResponseDto> {
    const sub = await this.schedule.cancelSubstitution(id);
    return ScheduleSubstitutionResponseDto.fromEntity(sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a schedule entry by ID' })
  @ApiResponse({ status: 200, type: ScheduleEntryResponseDto })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ScheduleEntryResponseDto> {
    const entry = await this.schedule.getById(id);
    return ScheduleEntryResponseDto.fromEntity(entry);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Update a schedule entry' })
  @ApiResponse({ status: 200, type: ScheduleEntryResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleEntryDto,
  ): Promise<ScheduleEntryResponseDto> {
    const entry = await this.schedule.update(id, dto);
    return ScheduleEntryResponseDto.fromEntity(entry);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a schedule entry' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.schedule.softDelete(id);
  }
}

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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '../../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConvertToStudentDto } from './dto/convert-to-student.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsQueryDto } from './dto/leads-query.dto';
import { UpdateLeadStageDto } from './dto/update-lead-stage.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads CRM')
@ApiBearerAuth()
@Controller({ path: 'leads', version: ['1'] })
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "Yangi nomzod (lid) qo'shish" })
  async create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "Lidlar ro'yxati (filtrlash bilan)" })
  async findAll(@Query() query: LeadsQueryDto) {
    return this.leadsService.findAll(query);
  }

  @Get('stats')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Qabul voronkasi statistikasi' })
  async getStats() {
    return this.leadsService.getStats();
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "Bitta lid ma'lumotlarini olish" })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id/stage')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "Lid bosqichini o'zgartirish (Kanban move)" })
  async updateStage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadStageDto) {
    return this.leadsService.updateStage(id, dto);
  }

  @Post(':id/convert')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "Lidni faol o'quvchiga aylantirish (Enroll)" })
  async convertToStudent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConvertToStudentDto) {
    return this.leadsService.convertToStudent(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "Lidni o'chirish" })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.delete(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RoleName } from '../../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@ApiTags('Branches (Filiallar)')
@ApiBearerAuth()
@Controller({ path: 'branches', version: ['1'] })
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: "Filiallar ro'yxati (List branches)" })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  async findAll(@Query('onlyActive') onlyActive?: string) {
    return this.branchesService.findAll(onlyActive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: "Filial ma'lumotlari (Get branch by ID)" })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Filial statistikasi (Get branch stats)' })
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.getStats(id);
  }

  @Post()
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: "Yangi filial qo'shish (Create branch)" })
  async create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Filialni tahrirlash (Update branch)' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Filialni faolsizlantirish (Deactivate branch)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.remove(id);
  }
}

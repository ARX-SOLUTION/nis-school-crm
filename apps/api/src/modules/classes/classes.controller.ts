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
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginatedResponseDto, PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { RoleName } from '../../common/enums/role.enum';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { ClassResponseDto } from './dto/class-response.dto';
import { ClassesQueryDto } from './dto/classes-query.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassesService } from './classes.service';

class ClassesListResponseDto extends PaginatedResponseDto<ClassResponseDto> {
  declare data: ClassResponseDto[];
  declare meta: PaginationMetaDto;
}

@ApiTags('Classes')
@ApiBearerAuth()
@Controller({ path: 'classes', version: ['1'] })
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Post()
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Create a class' })
  async create(@Body() dto: CreateClassDto): Promise<ClassResponseDto> {
    return ClassResponseDto.fromEntity(await this.classes.create(dto));
  }

  @Get()
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'List classes (paginated)' })
  async list(@Query() query: ClassesQueryDto): Promise<ClassesListResponseDto> {
    const page = await this.classes.list(query);
    return ClassesListResponseDto.of(
      page.data.map((c) => ClassResponseDto.fromEntity(c)),
      page.meta,
    ) as ClassesListResponseDto;
  }

  @Get(':id')
  @Roles(RoleName.MANAGER)
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ClassResponseDto> {
    return ClassResponseDto.fromEntity(await this.classes.getById(id));
  }

  @Patch(':id')
  @Roles(RoleName.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto,
  ): Promise<ClassResponseDto> {
    return ClassResponseDto.fromEntity(await this.classes.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.MANAGER)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.classes.softDelete(id);
  }

  @Patch(':id/assign-teacher')
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Assign a class teacher (must have TEACHER role)' })
  async assignTeacher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTeacherDto,
  ): Promise<ClassResponseDto> {
    return ClassResponseDto.fromEntity(await this.classes.assignTeacher(id, dto.teacherId));
  }
}

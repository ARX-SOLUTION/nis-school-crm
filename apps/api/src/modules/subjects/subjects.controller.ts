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
import { PaginatedResponseDto, PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { RoleName } from '../../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { SubjectsQueryDto } from './dto/subjects-query.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsService } from './subjects.service';

class SubjectsListResponseDto extends PaginatedResponseDto<SubjectResponseDto> {
  declare data: SubjectResponseDto[];
  declare meta: PaginationMetaDto;
}

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller({ path: 'subjects', version: ['1'] })
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Create a subject' })
  @ApiResponse({ status: 201, type: SubjectResponseDto })
  async create(@Body() dto: CreateSubjectDto): Promise<SubjectResponseDto> {
    return SubjectResponseDto.fromEntity(await this.subjects.create(dto));
  }

  @Get()
  @ApiOperation({
    summary: 'List subjects (paginated, filterable by search / active / gradeLevel)',
  })
  @ApiResponse({ status: 200, type: SubjectsListResponseDto })
  async list(@Query() query: SubjectsQueryDto): Promise<SubjectsListResponseDto> {
    const page = await this.subjects.list(query);
    return SubjectsListResponseDto.of(
      page.data.map((s) => SubjectResponseDto.fromEntity(s)),
      page.meta,
    ) as SubjectsListResponseDto;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiResponse({ status: 200, type: SubjectResponseDto })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<SubjectResponseDto> {
    return SubjectResponseDto.fromEntity(await this.subjects.getById(id));
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Partially update a subject (code is immutable)' })
  @ApiResponse({ status: 200, type: SubjectResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return SubjectResponseDto.fromEntity(await this.subjects.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a subject (preserves historical grade data)' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.subjects.softDelete(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto, PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ArchiveStudentDto } from './dto/archive-student.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { ClassHistoryResponseDto } from './dto/class-history-response.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { StudentsQueryDto } from './dto/students-query.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

class StudentsListResponseDto extends PaginatedResponseDto<StudentResponseDto> {
  declare data: StudentResponseDto[];
  declare meta: PaginationMetaDto;
}

@ApiTags('Students')
@ApiBearerAuth()
@Controller({ path: 'students', version: ['1'] })
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Post()
  @Roles(RoleName.MANAGER)
  @ApiOperation({
    summary: 'Create a student (optionally assigning to a class in one transaction)',
  })
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StudentResponseDto> {
    return StudentResponseDto.fromEntity(
      await this.students.create(dto, { id: actor.id, role: actor.role }),
    );
  }

  @Get()
  @Roles(RoleName.MANAGER)
  async list(@Query() query: StudentsQueryDto): Promise<StudentsListResponseDto> {
    const page = await this.students.list(query);
    return StudentsListResponseDto.of(
      page.data.map((s) => StudentResponseDto.fromEntity(s)),
      page.meta,
    ) as StudentsListResponseDto;
  }

  @Get('export')
  @Roles(RoleName.ADMIN)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="students.csv"')
  @ApiOperation({
    summary:
      'Download a CSV export of every student (ADMIN+ only). Loads the full ' +
      'dataset into memory — at the MVP scale of ~500 students this is fine, ' +
      'but a streaming exporter will be needed before multi-school scale.',
  })
  async export(): Promise<string> {
    return this.students.exportCsv();
  }

  @Get(':id')
  @Roles(RoleName.MANAGER)
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<StudentResponseDto> {
    return StudentResponseDto.fromEntity(await this.students.getById(id));
  }

  @Patch(':id')
  @Roles(RoleName.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return StudentResponseDto.fromEntity(await this.students.update(id, dto));
  }

  @Patch(':id/assign-class')
  @Roles(RoleName.MANAGER)
  @ApiOperation({
    summary:
      'Move a student into a class. Enforces grade-level match, max-students capacity, and transactional history.',
  })
  async assignClass(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignClassDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StudentResponseDto> {
    const student = await this.students.assignClass(
      id,
      dto.classId,
      { id: actor.id, role: actor.role },
      dto.reason,
    );
    return StudentResponseDto.fromEntity(student);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Archive a student (status=INACTIVE + leftAt/leftReason set)' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ArchiveStudentDto,
  ): Promise<StudentResponseDto> {
    return StudentResponseDto.fromEntity(await this.students.archive(id, dto.reason));
  }

  @Get(':id/class-history')
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Class assignment history for a student (newest first)' })
  async history(@Param('id', ParseUUIDPipe) id: string): Promise<ClassHistoryResponseDto[]> {
    const rows = await this.students.findHistory(id);
    return rows.map((r) => ClassHistoryResponseDto.fromEntity(r));
  }
}

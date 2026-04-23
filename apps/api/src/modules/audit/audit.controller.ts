import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto, PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { RoleName } from '../../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditLogResponseDto } from './dto/audit-response.dto';
import { AuditService } from './audit.service';

class AuditListResponseDto extends PaginatedResponseDto<AuditLogResponseDto> {
  declare data: AuditLogResponseDto[];
  declare meta: PaginationMetaDto;
}

@ApiTags('Audit')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: ['1'] })
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'List audit log entries (ADMIN+ only)' })
  async list(@Query() query: AuditQueryDto): Promise<AuditListResponseDto> {
    const page = await this.audit.list(query);
    return AuditListResponseDto.of(
      page.data.map((e) => AuditLogResponseDto.fromEntity(e)),
      page.meta,
    ) as AuditListResponseDto;
  }
}

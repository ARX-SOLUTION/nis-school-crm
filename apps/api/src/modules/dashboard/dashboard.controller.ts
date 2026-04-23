import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { RoleName } from '../../common/enums/role.enum';
import { AuditLogResponseDto } from '../audit/dto/audit-response.dto';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'dashboard', version: ['1'] })
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  @Roles(RoleName.TEACHER) // all authenticated roles pass via hierarchy
  @ApiOperation({ summary: 'Role-scoped dashboard statistics' })
  async stats(@CurrentUser() actor: AuthenticatedUser): Promise<DashboardStatsDto> {
    return this.dashboard.getStats({ id: actor.id, role: actor.role });
  }

  @Get('recent-activity')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Last 10 audit entries (ADMIN+ only)' })
  async recent(): Promise<AuditLogResponseDto[]> {
    const rows = await this.dashboard.getRecentActivity(10);
    return rows.map((r) => AuditLogResponseDto.fromEntity(r));
  }
}

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { NotificationLogDto } from '@nis/shared';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { SendBroadcastDto } from './dto/send-broadcast.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: ['1'] })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a broadcast message/announcement' })
  @ApiResponse({ status: 201 })
  async sendBroadcast(
    @Body() dto: SendBroadcastDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationLogDto> {
    return this.notificationsService.sendBroadcast(dto, {
      id: user.id,
      fullName: user.email,
    });
  }

  @Get('history')
  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get notification logs history' })
  @ApiResponse({ status: 200 })
  async getLogs(@Query('limit') limit?: number): Promise<NotificationLogDto[]> {
    return this.notificationsService.getLogs(limit ? Number(limit) : 50);
  }
}

import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NotificationLogDto } from '@nis/shared';
import {
  EVENT_BROADCAST_ANNOUNCEMENT,
  BroadcastAnnouncementEvent,
} from '../../common/events/contracts';
import { EventBusService } from '../../common/events/event-bus.service';
import { RoleName } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { SendBroadcastDto } from './dto/send-broadcast.dto';
import { NotificationLog } from './entities/notification-log.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly logsRepo: Repository<NotificationLog>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @Optional() private readonly eventBus?: EventBusService,
  ) {}

  async sendBroadcast(
    dto: SendBroadcastDto,
    sender?: { id: string; fullName: string },
  ): Promise<NotificationLogDto> {
    let recipientCount = 0;

    if (dto.target === 'ALL_PARENTS') {
      recipientCount = await this.usersRepo.count({
        where: { role: RoleName.PARENT, isActive: true },
      });
    } else if (dto.target === 'ALL_TEACHERS') {
      recipientCount = await this.usersRepo.count({
        where: { role: RoleName.TEACHER, isActive: true },
      });
    } else {
      recipientCount = await this.usersRepo.count({ where: { isActive: true } });
    }

    if (this.eventBus) {
      await this.eventBus
        .publish<BroadcastAnnouncementEvent>(EVENT_BROADCAST_ANNOUNCEMENT, {
          title: dto.title,
          message: dto.message,
          target: dto.target,
          classId: dto.classId,
          sentByUserId: sender?.id,
        })
        .catch(() => {});
    }

    const log = this.logsRepo.create({
      title: dto.title,
      message: dto.message,
      type: 'ANNOUNCEMENT',
      target: dto.target,
      channel: 'TELEGRAM',
      recipientCount: Math.max(recipientCount, 1),
      classId: dto.classId ?? null,
      sentByUserId: sender?.id ?? null,
      sentByName: sender?.fullName ?? null,
    });

    const saved = await this.logsRepo.save(log);

    return {
      id: saved.id,
      title: saved.title,
      message: saved.message,
      type: saved.type,
      target: saved.target,
      channel: saved.channel,
      recipientCount: saved.recipientCount,
      sentByUserId: saved.sentByUserId,
      sentByName: saved.sentByName,
      createdAt: saved.createdAt,
    };
  }

  async getLogs(limit = 50): Promise<NotificationLogDto[]> {
    const logs = await this.logsRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return logs.map((l) => ({
      id: l.id,
      title: l.title,
      message: l.message,
      type: l.type,
      target: l.target,
      channel: l.channel,
      recipientCount: l.recipientCount,
      sentByUserId: l.sentByUserId,
      sentByName: l.sentByName,
      createdAt: l.createdAt,
    }));
  }
}

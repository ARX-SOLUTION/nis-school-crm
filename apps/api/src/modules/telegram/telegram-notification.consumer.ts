import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EVENT_USER_CREATED,
  EVENT_USER_PASSWORD_RESET,
  UserCreatedEvent,
  UserPasswordResetEvent,
} from '../../common/events/contracts';
import { EventBusService, EventEnvelope } from '../../common/events/event-bus.service';
import { User } from '../users/entities/user.entity';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramRateLimitService } from './services/telegram-rate-limit.service';
import {
  pickLocale,
  renderUserCreated,
  renderUserPasswordReset,
} from './templates/notification-templates';

export const TELEGRAM_NOTIFICATION_QUEUE = 'notifications.telegram';

type NotificationPayload = UserCreatedEvent | UserPasswordResetEvent;

@Injectable()
export class TelegramNotificationConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramNotificationConsumer.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly bot: TelegramBotService,
    private readonly rateLimit: TelegramRateLimitService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.eventBus.consume<NotificationPayload>(
      {
        queue: TELEGRAM_NOTIFICATION_QUEUE,
        // Matches user.created + user.password_reset; tighten later if the
        // user.* namespace grows beyond notifications.
        patterns: ['user.created', 'user.password_reset'],
        maxRetries: 3,
      },
      (envelope) => this.handle(envelope),
    );
  }

  private async handle(envelope: EventEnvelope<NotificationPayload>): Promise<void> {
    if (!this.bot.isEnabled()) {
      // Dev-mode without a token: acknowledge and move on. No DLQ noise.
      return;
    }

    const user = await this.users.findOne({ where: { id: envelope.payload.userId } });
    if (!user) {
      this.logger.warn(`notification skipped — user ${envelope.payload.userId} not found`);
      return;
    }
    if (!user.telegramChatId) {
      this.logger.warn(`notification skipped — user ${user.id} has no linked Telegram chat`);
      return;
    }

    const allowed = await this.rateLimit.checkAndBump(user.telegramChatId);
    if (!allowed) {
      this.logger.warn(`notification dropped — rate-limited chat ${user.telegramChatId}`);
      return;
    }

    const locale = pickLocale(null); // TODO: pick from user.locale once Stage 7 adds it.
    const text =
      envelope.routingKey === EVENT_USER_CREATED
        ? renderUserCreated(envelope.payload as UserCreatedEvent, locale)
        : envelope.routingKey === EVENT_USER_PASSWORD_RESET
          ? renderUserPasswordReset(envelope.payload as UserPasswordResetEvent, locale)
          : null;

    if (!text) {
      this.logger.warn(`unhandled routing key: ${envelope.routingKey}`);
      return;
    }

    await this.bot.sendMarkdown(user.telegramChatId, text);
  }
}

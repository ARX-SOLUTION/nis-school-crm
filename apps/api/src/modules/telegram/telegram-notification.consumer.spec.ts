import { Repository } from 'typeorm';
import {
  EVENT_USER_CREATED,
  EVENT_USER_PASSWORD_RESET,
  UserCreatedEvent,
} from '../../common/events/contracts';
import type { EventBusService, EventEnvelope } from '../../common/events/event-bus.service';
import { RoleName } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import type { TelegramBotService } from './telegram-bot.service';
import type { TelegramRateLimitService } from './services/telegram-rate-limit.service';
import { TelegramNotificationConsumer } from './telegram-notification.consumer';

const baseEvent: UserCreatedEvent = {
  userId: 'u-1',
  email: 'ali@nis.uz',
  fullName: 'Ali Valiyev',
  role: RoleName.MANAGER,
  telegramUsername: null,
  generatedPassword: 'p4ss',
  createdByUserId: 'admin-1',
};

const envelope = (
  routingKey = EVENT_USER_CREATED,
  payload: UserCreatedEvent = baseEvent,
): EventEnvelope<UserCreatedEvent> => ({
  messageId: 'm-1',
  occurredAt: new Date().toISOString(),
  routingKey,
  payload,
});

describe('TelegramNotificationConsumer', () => {
  const build = () => {
    let registered: ((e: EventEnvelope<UserCreatedEvent>) => Promise<void>) | null = null;
    const bus = {
      consume: jest.fn(async (_spec, handler) => {
        registered = handler;
      }),
    } as unknown as EventBusService;
    const bot = {
      isEnabled: jest.fn().mockReturnValue(true),
      sendMarkdown: jest.fn().mockResolvedValue(true),
    } as unknown as TelegramBotService;
    const rateLimit = {
      checkAndBump: jest.fn().mockResolvedValue(true),
    } as unknown as TelegramRateLimitService;
    const users = {
      findOne: jest.fn(),
    } as unknown as Repository<User>;
    const consumer = new TelegramNotificationConsumer(bus, bot, rateLimit, users);
    return {
      consumer,
      bot: bot as unknown as { sendMarkdown: jest.Mock; isEnabled: jest.Mock },
      rateLimit: rateLimit as unknown as { checkAndBump: jest.Mock },
      users: users as unknown as { findOne: jest.Mock },
      invoke: async (env: EventEnvelope<UserCreatedEvent>): Promise<void> => {
        if (!registered) throw new Error('handler not registered');
        await registered(env);
      },
    };
  };

  it('should_skip_silently_when_bot_disabled', async () => {
    const { consumer, bot, users, invoke } = build();
    bot.isEnabled.mockReturnValueOnce(false);
    await consumer.onApplicationBootstrap();
    await invoke(envelope());
    expect(users.findOne).not.toHaveBeenCalled();
    expect(bot.sendMarkdown).not.toHaveBeenCalled();
  });

  it('should_skip_when_user_has_no_chat_id', async () => {
    const { consumer, bot, users, invoke } = build();
    users.findOne.mockResolvedValue({ id: 'u-1', telegramChatId: null });
    await consumer.onApplicationBootstrap();
    await invoke(envelope());
    expect(bot.sendMarkdown).not.toHaveBeenCalled();
  });

  it('should_drop_when_rate_limit_exceeded', async () => {
    const { consumer, bot, rateLimit, users, invoke } = build();
    users.findOne.mockResolvedValue({ id: 'u-1', telegramChatId: '999' });
    rateLimit.checkAndBump.mockResolvedValueOnce(false);
    await consumer.onApplicationBootstrap();
    await invoke(envelope());
    expect(bot.sendMarkdown).not.toHaveBeenCalled();
  });

  it('should_render_user_created_template_and_send', async () => {
    const { consumer, bot, users, invoke } = build();
    users.findOne.mockResolvedValue({
      id: 'u-1',
      telegramChatId: '999',
      fullName: 'x',
      role: 'MANAGER',
    });
    await consumer.onApplicationBootstrap();
    await invoke(envelope());
    expect(bot.sendMarkdown).toHaveBeenCalledTimes(1);
    const [chatId, text] = bot.sendMarkdown.mock.calls[0] as [string, string];
    expect(chatId).toBe('999');
    expect(text).toContain('p4ss');
  });

  it('should_render_password_reset_template_for_different_routing_key', async () => {
    const { consumer, bot, users, invoke } = build();
    users.findOne.mockResolvedValue({ id: 'u-1', telegramChatId: '999' });
    await consumer.onApplicationBootstrap();
    await invoke(envelope(EVENT_USER_PASSWORD_RESET));
    const [, text] = bot.sendMarkdown.mock.calls[0] as [string, string];
    // The reset template uses "parolingiz" in uz ("your password"). Make sure
    // we aren't accidentally rendering the welcome template instead.
    expect(text).toMatch(/parolingiz/i);
  });

  it('should_skip_unknown_routing_key_without_sending', async () => {
    const { consumer, bot, users, invoke } = build();
    users.findOne.mockResolvedValue({ id: 'u-1', telegramChatId: '999' });
    await consumer.onApplicationBootstrap();
    await invoke(envelope('user.unknown'));
    expect(bot.sendMarkdown).not.toHaveBeenCalled();
  });
});

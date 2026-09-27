import { Repository } from 'typeorm';
import {
  AttendanceRecordedEvent,
  BroadcastAnnouncementEvent,
  EVENT_ATTENDANCE_RECORDED,
  EVENT_BROADCAST_ANNOUNCEMENT,
  EVENT_GRADE_RECORDED,
  EVENT_PAYMENT_RECORDED,
  EVENT_USER_CREATED,
  EVENT_USER_PASSWORD_RESET,
  GradeRecordedEvent,
  PaymentRecordedEvent,
  UserCreatedEvent,
} from '../../common/events/contracts';
import type { EventBusService, EventEnvelope } from '../../common/events/event-bus.service';
import { RoleName } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { ParentStudent } from '../parents/entities/parent-student.entity';
import { Student } from '../students/entities/student.entity';
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

const envelope = <T = unknown>(
  routingKey = EVENT_USER_CREATED,
  payload: unknown = baseEvent,
): EventEnvelope<T> => ({
  messageId: 'm-1',
  occurredAt: new Date().toISOString(),
  routingKey,
  payload: payload as T,
});

describe('TelegramNotificationConsumer', () => {
  const build = () => {
    let registered: ((e: EventEnvelope<unknown>) => Promise<void>) | null = null;
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
      find: jest.fn().mockResolvedValue([]),
    } as unknown as Repository<User>;
    const parentStudents = {
      find: jest.fn().mockResolvedValue([]),
    } as unknown as Repository<ParentStudent>;
    const students = {
      find: jest.fn().mockResolvedValue([]),
    } as unknown as Repository<Student>;

    const consumer = new TelegramNotificationConsumer(
      bus,
      bot,
      rateLimit,
      users,
      parentStudents,
      students,
    );

    return {
      consumer,
      bot: bot as unknown as { sendMarkdown: jest.Mock; isEnabled: jest.Mock },
      rateLimit: rateLimit as unknown as { checkAndBump: jest.Mock },
      users: users as unknown as { findOne: jest.Mock; find: jest.Mock },
      parentStudents: parentStudents as unknown as { find: jest.Mock },
      students: students as unknown as { find: jest.Mock },
      invoke: async (env: EventEnvelope<unknown>): Promise<void> => {
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
    expect(text).toMatch(/parolingiz/i);
  });

  it('should_skip_unknown_routing_key_without_sending', async () => {
    const { consumer, bot, users, invoke } = build();
    users.findOne.mockResolvedValue({ id: 'u-1', telegramChatId: '999' });
    await consumer.onApplicationBootstrap();
    await invoke(envelope('user.unknown'));
    expect(bot.sendMarkdown).not.toHaveBeenCalled();
  });

  it('should_render_attendance_alert_and_send_to_parent', async () => {
    const { consumer, bot, parentStudents, invoke } = build();
    parentStudents.find.mockResolvedValue([
      {
        parentUser: { id: 'parent-1', telegramChatId: '777', language: 'uz' },
      },
    ]);
    const attendancePayload: AttendanceRecordedEvent = {
      studentId: 'stud-1',
      studentName: 'Temur Aliyev',
      classId: 'cls-1',
      date: '2026-09-27',
      status: 'ABSENT',
      remarks: 'Sababsiz dars qoldirdi',
    };
    await consumer.onApplicationBootstrap();
    await invoke(envelope(EVENT_ATTENDANCE_RECORDED, attendancePayload));
    expect(bot.sendMarkdown).toHaveBeenCalledTimes(1);
    const [chatId, text] = bot.sendMarkdown.mock.calls[0] as [string, string];
    expect(chatId).toBe('777');
    expect(text).toContain('Davomat xabarnomasi');
    expect(text).toContain('Temur Aliyev');
    expect(text).toContain('Sababsiz dars qoldirdi');
  });

  it('should_render_grade_alert_and_send_to_parent', async () => {
    const { consumer, bot, parentStudents, invoke } = build();
    parentStudents.find.mockResolvedValue([
      {
        parentUser: { id: 'parent-1', telegramChatId: '777', language: 'uz' },
      },
    ]);
    const gradePayload: GradeRecordedEvent = {
      studentId: 'stud-1',
      studentName: 'Temur Aliyev',
      subjectName: 'Matematika',
      score: 95,
      maxScore: 100,
      gradeType: 'EXAM',
      date: '2026-09-27',
      comment: "A'lo natija",
    };
    await consumer.onApplicationBootstrap();
    await invoke(envelope(EVENT_GRADE_RECORDED, gradePayload));
    expect(bot.sendMarkdown).toHaveBeenCalledTimes(1);
    const [chatId, text] = bot.sendMarkdown.mock.calls[0] as [string, string];
    expect(chatId).toBe('777');
    expect(text).toContain('Yangi baho qayd etildi');
    expect(text).toContain('95');
    expect(text).toContain('Matematika');
  });

  it('should_render_payment_receipt_and_send_to_parent', async () => {
    const { consumer, bot, parentStudents, invoke } = build();
    parentStudents.find.mockResolvedValue([
      {
        parentUser: { id: 'parent-1', telegramChatId: '777', language: 'uz' },
      },
    ]);
    const paymentPayload: PaymentRecordedEvent = {
      studentId: 'stud-1',
      studentName: 'Temur Aliyev',
      amount: 1500000,
      method: 'PAYME',
      receiptNumber: 'REC-9981',
      month: '2026-09',
      paidAt: '2026-09-27T10:00:00Z',
    };
    await consumer.onApplicationBootstrap();
    await invoke(envelope(EVENT_PAYMENT_RECORDED, paymentPayload));
    expect(bot.sendMarkdown).toHaveBeenCalledTimes(1);
    const [chatId, text] = bot.sendMarkdown.mock.calls[0] as [string, string];
    expect(chatId).toBe('777');
    expect(text).toContain("To'lov qabul qilindi");
    expect(text).toContain('REC\\-9981');
  });

  it('should_broadcast_announcement_to_parents', async () => {
    const { consumer, bot, users, invoke } = build();
    users.find.mockResolvedValue([
      { id: 'p-1', telegramChatId: '555', role: RoleName.PARENT, language: 'uz' },
      { id: 'p-2', telegramChatId: '666', role: RoleName.PARENT, language: 'uz' },
    ]);
    const broadcastPayload: BroadcastAnnouncementEvent = {
      title: 'Majlis',
      message: 'Ertaga soat 18:00 da ota-onalar majlisi',
      target: 'PARENTS',
    };
    await consumer.onApplicationBootstrap();
    await invoke(envelope(EVENT_BROADCAST_ANNOUNCEMENT, broadcastPayload));
    expect(bot.sendMarkdown).toHaveBeenCalledTimes(2);
    expect(bot.sendMarkdown).toHaveBeenCalledWith('555', expect.stringContaining('Majlis'));
    expect(bot.sendMarkdown).toHaveBeenCalledWith('666', expect.stringContaining('Majlis'));
  });
});

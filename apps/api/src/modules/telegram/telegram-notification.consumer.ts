import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
  UserPasswordResetEvent,
} from '../../common/events/contracts';
import { EventBusService, EventEnvelope } from '../../common/events/event-bus.service';
import { RoleName } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { ParentStudent } from '../parents/entities/parent-student.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramRateLimitService } from './services/telegram-rate-limit.service';
import {
  pickLocale,
  renderAttendanceAlert,
  renderBroadcastAnnouncement,
  renderGradeAlert,
  renderPaymentReceipt,
  renderUserCreated,
  renderUserPasswordReset,
} from './templates/notification-templates';

export const TELEGRAM_NOTIFICATION_QUEUE = 'notifications.telegram';

type NotificationPayload =
  | UserCreatedEvent
  | UserPasswordResetEvent
  | AttendanceRecordedEvent
  | GradeRecordedEvent
  | PaymentRecordedEvent
  | BroadcastAnnouncementEvent;

@Injectable()
export class TelegramNotificationConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramNotificationConsumer.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly bot: TelegramBotService,
    private readonly rateLimit: TelegramRateLimitService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @Optional()
    @InjectRepository(ParentStudent)
    private readonly parentStudents?: Repository<ParentStudent>,
    @Optional() @InjectRepository(Student) private readonly students?: Repository<Student>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.eventBus.consume<NotificationPayload>(
      {
        queue: TELEGRAM_NOTIFICATION_QUEUE,
        patterns: [
          'user.created',
          'user.password_reset',
          'attendance.recorded',
          'grade.recorded',
          'payment.recorded',
          'broadcast.announcement',
        ],
        maxRetries: 3,
      },
      (envelope) => this.handle(envelope),
    );
  }

  private async handle(envelope: EventEnvelope<NotificationPayload>): Promise<void> {
    if (!this.bot.isEnabled()) {
      return;
    }

    const { routingKey, payload } = envelope;

    if (routingKey === EVENT_USER_CREATED || routingKey === EVENT_USER_PASSWORD_RESET) {
      await this.handleUserAuthEvent(
        envelope as EventEnvelope<UserCreatedEvent | UserPasswordResetEvent>,
      );
      return;
    }

    if (routingKey === EVENT_ATTENDANCE_RECORDED) {
      await this.handleAttendanceEvent(payload as AttendanceRecordedEvent);
      return;
    }

    if (routingKey === EVENT_GRADE_RECORDED) {
      await this.handleGradeEvent(payload as GradeRecordedEvent);
      return;
    }

    if (routingKey === EVENT_PAYMENT_RECORDED) {
      await this.handlePaymentEvent(payload as PaymentRecordedEvent);
      return;
    }

    if (routingKey === EVENT_BROADCAST_ANNOUNCEMENT) {
      await this.handleBroadcastEvent(payload as BroadcastAnnouncementEvent);
      return;
    }

    this.logger.warn(`unhandled routing key: ${routingKey}`);
  }

  private async sendToUser(user: User, text: string): Promise<boolean> {
    if (!user.telegramChatId) {
      return false;
    }

    const allowed = await this.rateLimit.checkAndBump(user.telegramChatId);
    if (!allowed) {
      this.logger.warn(`notification dropped - rate-limited chat ${user.telegramChatId}`);
      return false;
    }

    return this.bot.sendMarkdown(user.telegramChatId, text);
  }

  private async getParentsForStudent(studentId: string): Promise<User[]> {
    if (!this.parentStudents) {
      return [];
    }

    const links = await this.parentStudents.find({
      where: { studentId },
      relations: ['parentUser'],
    });

    return links.map((l) => l.parentUser).filter((u): u is User => Boolean(u && u.telegramChatId));
  }

  private async handleUserAuthEvent(
    envelope: EventEnvelope<UserCreatedEvent | UserPasswordResetEvent>,
  ): Promise<void> {
    const user = await this.users.findOne({ where: { id: envelope.payload.userId } });
    if (!user) {
      this.logger.warn(`notification skipped - user ${envelope.payload.userId} not found`);
      return;
    }
    if (!user.telegramChatId) {
      this.logger.warn(`notification skipped - user ${user.id} has no linked Telegram chat`);
      return;
    }

    const locale = pickLocale(user.language);
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

    await this.sendToUser(user, text);
  }

  private async handleAttendanceEvent(event: AttendanceRecordedEvent): Promise<void> {
    const parents = await this.getParentsForStudent(event.studentId);
    if (!parents.length) {
      this.logger.debug(`no linked parents with Telegram for student ${event.studentId}`);
      return;
    }

    for (const parent of parents) {
      const locale = pickLocale(parent.language);
      const text = renderAttendanceAlert(event, locale);
      await this.sendToUser(parent, text);
    }
  }

  private async handleGradeEvent(event: GradeRecordedEvent): Promise<void> {
    const parents = await this.getParentsForStudent(event.studentId);
    if (!parents.length) {
      this.logger.debug(`no linked parents with Telegram for student ${event.studentId}`);
      return;
    }

    for (const parent of parents) {
      const locale = pickLocale(parent.language);
      const text = renderGradeAlert(event, locale);
      await this.sendToUser(parent, text);
    }
  }

  private async handlePaymentEvent(event: PaymentRecordedEvent): Promise<void> {
    const parents = await this.getParentsForStudent(event.studentId);
    if (!parents.length) {
      this.logger.debug(`no linked parents with Telegram for student ${event.studentId}`);
      return;
    }

    for (const parent of parents) {
      const locale = pickLocale(parent.language);
      const text = renderPaymentReceipt(event, locale);
      await this.sendToUser(parent, text);
    }
  }

  private async handleBroadcastEvent(event: BroadcastAnnouncementEvent): Promise<void> {
    let recipients: User[] = [];

    if (event.target === 'PARENTS') {
      recipients = await this.users.find({
        where: { role: RoleName.PARENT, isActive: true },
      });
    } else if (event.target === 'TEACHERS') {
      recipients = await this.users.find({
        where: { role: RoleName.TEACHER, isActive: true },
      });
    } else if (event.target === 'CLASS' && event.classId) {
      if (this.students && this.parentStudents) {
        const classStudents = await this.students.find({
          where: { classId: event.classId, status: StudentStatus.ACTIVE },
          select: ['id'],
        });
        const studentIds = classStudents.map((s) => s.id);
        if (studentIds.length > 0) {
          const links = await this.parentStudents.find({
            where: { studentId: In(studentIds) },
            relations: ['parentUser'],
          });
          recipients = links
            .map((l) => l.parentUser)
            .filter((u): u is User => Boolean(u && u.telegramChatId));
        }
      }
    } else {
      recipients = await this.users.find({
        where: { isActive: true },
      });
    }

    const uniqueRecipients = Array.from(new Map(recipients.map((u) => [u.id, u])).values());

    for (const user of uniqueRecipients) {
      if (!user.telegramChatId) continue;
      const locale = pickLocale(user.language);
      const text = renderBroadcastAnnouncement(event, locale);
      await this.sendToUser(user, text);
    }
  }
}

import {
  UserCreatedEvent,
  UserPasswordResetEvent,
  AttendanceRecordedEvent,
  GradeRecordedEvent,
  PaymentRecordedEvent,
  BroadcastAnnouncementEvent,
} from '../../../common/events/contracts';

export const LOCALES = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'uz';

export function pickLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const normalised = input.toLowerCase().slice(0, 2);
  return (LOCALES as readonly string[]).includes(normalised)
    ? (normalised as Locale)
    : DEFAULT_LOCALE;
}

/**
 * Telegram MarkdownV2 escape. The set of special characters is defined by
 * the Telegram Bot API; escaping the generated password avoids accidentally
 * turning characters like `_` or `*` into formatting marks.
 */
export function escapeMd(value: string): string {
  return value.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export function renderUserCreated(event: UserCreatedEvent, locale: Locale): string {
  const name = escapeMd(event.fullName);
  const pw = escapeMd(event.generatedPassword);
  const role = event.role;
  switch (locale) {
    case 'ru':
      return (
        `👋 Здравствуйте, *${name}*\\!\n` +
        `Вам создали аккаунт в NIS School CRM как *${role}*\\.\n` +
        `Ваш одноразовый пароль:\n\n` +
        `\`${pw}\`\n\n` +
        `Войдите и смените его при первом входе\\.`
      );
    case 'en':
      return (
        `👋 Hi, *${name}*\\!\n` +
        `An NIS School CRM account has been created for you as *${role}*\\.\n` +
        `Your one\\-time password:\n\n` +
        `\`${pw}\`\n\n` +
        `Sign in and change it on first login\\.`
      );
    case 'uz':
    default:
      return (
        `👋 Salom, *${name}*\\!\n` +
        `Sizga NIS School CRM akkaunti *${role}* sifatida yaratildi\\.\n` +
        `Bir martalik parolingiz:\n\n` +
        `\`${pw}\`\n\n` +
        `Kirib, birinchi kirishda uni o'zgartiring\\.`
      );
  }
}

export function renderUserPasswordReset(event: UserPasswordResetEvent, locale: Locale): string {
  const name = escapeMd(event.fullName);
  const pw = escapeMd(event.generatedPassword);
  switch (locale) {
    case 'ru':
      return (
        `🔐 *${name}*, ваш пароль был сброшен администратором\\.\n` +
        `Новый одноразовый пароль:\n\n` +
        `\`${pw}\`\n\n` +
        `Если вы не запрашивали сброс - свяжитесь с администрацией\\.`
      );
    case 'en':
      return (
        `🔐 *${name}*, your password was reset by an administrator\\.\n` +
        `New one\\-time password:\n\n` +
        `\`${pw}\`\n\n` +
        `If you did not request this, contact administration\\.`
      );
    case 'uz':
    default:
      return (
        `🔐 *${name}*, parolingiz administrator tomonidan qayta o'rnatildi\\.\n` +
        `Yangi bir martalik parol:\n\n` +
        `\`${pw}\`\n\n` +
        `Agar bu so'rovni siz yubormagan bo'lsangiz - administratsiyaga murojaat qiling\\.`
      );
  }
}

export function renderAttendanceAlert(event: AttendanceRecordedEvent, _locale: Locale): string {
  const name = escapeMd(event.studentName || 'Farzandingiz');
  const date = escapeMd(event.date);
  const statusUz = event.status === 'ABSENT' ? 'darsga kelmadi' : 'darsga kechikib keldi';
  return (
    `⚠️ *Davomat xabarnomasi*\n\n` +
    `Hurmatli ota-ona\\!\n` +
    `*${name}* bugun \\(${date}\\) ${statusUz}\\.\n` +
    (event.remarks ? `Izoh: _${escapeMd(event.remarks)}_\n` : '')
  );
}

export function renderGradeAlert(event: GradeRecordedEvent, _locale: Locale): string {
  const name = escapeMd(event.studentName || 'Farzandingiz');
  const subj = escapeMd(event.subjectName || 'Fan');
  const score = escapeMd(String(event.score));
  const max = escapeMd(String(event.maxScore));
  return (
    `📊 *Yangi baho qayd etildi*\n\n` +
    `*${name}* *${subj}* fanidan yangi baho oldi:\n` +
    `Baho: *${score}* / *${max}*\n` +
    `Tur: \`${escapeMd(event.gradeType)}\`\n` +
    (event.comment ? `Izoh: _${escapeMd(event.comment)}_\n` : '')
  );
}

export function renderPaymentReceipt(event: PaymentRecordedEvent, _locale: Locale): string {
  const name = escapeMd(event.studentName || "O'quvchi");
  const amount = escapeMd(Number(event.amount).toLocaleString());
  const receipt = escapeMd(event.receiptNumber);
  const method = escapeMd(event.method);
  return (
    `💳 *To'lov qabul qilindi*\n\n` +
    `O'quvchi: *${name}*\n` +
    `To'langan summa: *${amount} UZS*\n` +
    `To'lov usuli: \`${method}\`\n` +
    `Kvitansiya: \`#${receipt}\`\n\n` +
    `To'lovingiz uchun rahmat\\!`
  );
}

export function renderBroadcastAnnouncement(
  event: BroadcastAnnouncementEvent,
  _locale: Locale,
): string {
  const title = escapeMd(event.title);
  const message = escapeMd(event.message);
  return `📢 *${title}*\n\n${message}`;
}

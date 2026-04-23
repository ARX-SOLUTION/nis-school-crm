import { UserCreatedEvent, UserPasswordResetEvent } from '../../../common/events/contracts';

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
        `Если вы не запрашивали сброс — свяжитесь с администрацией\\.`
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
        `Agar bu so'rovni siz yubormagan bo'lsangiz — administratsiyaga murojaat qiling\\.`
      );
  }
}

import { RoleName } from '../../../common/enums/role.enum';
import {
  DEFAULT_LOCALE,
  escapeMd,
  pickLocale,
  renderUserCreated,
  renderUserPasswordReset,
} from './notification-templates';

describe('escapeMd', () => {
  it('should_escape_underscores_and_stars', () => {
    expect(escapeMd('new_user*!')).toBe('new\\_user\\*\\!');
  });

  it('should_escape_backticks_and_brackets', () => {
    expect(escapeMd('[code] `x`')).toBe('\\[code\\] \\`x\\`');
  });

  it('should_leave_safe_characters_untouched', () => {
    expect(escapeMd('hello world 123')).toBe('hello world 123');
  });
});

describe('pickLocale', () => {
  it('should_default_to_uz_when_null', () => {
    expect(pickLocale(null)).toBe(DEFAULT_LOCALE);
  });

  it('should_normalize_and_return_supported_locale', () => {
    expect(pickLocale('ru-RU')).toBe('ru');
    expect(pickLocale('EN')).toBe('en');
  });

  it('should_fall_back_for_unsupported_locales', () => {
    expect(pickLocale('fr')).toBe(DEFAULT_LOCALE);
  });
});

const userCreatedEvent = {
  userId: 'u-1',
  email: 'ali@nis.uz',
  fullName: 'Ali Valiyev',
  role: RoleName.MANAGER,
  telegramUsername: null,
  generatedPassword: 'Some_P@ss-word!',
  createdByUserId: 'admin-1',
};

describe('renderUserCreated', () => {
  it('should_include_escaped_password_and_name_in_uz', () => {
    const out = renderUserCreated(userCreatedEvent, 'uz');
    expect(out).toContain('Ali Valiyev');
    expect(out).toContain('Some\\_P@ss\\-word\\!');
    expect(out).toContain('MANAGER');
  });

  it('should_include_english_copy_when_locale_en', () => {
    const out = renderUserCreated(userCreatedEvent, 'en');
    expect(out.toLowerCase()).toContain('one');
    expect(out).toContain('MANAGER');
  });

  it('should_include_russian_copy_when_locale_ru', () => {
    const out = renderUserCreated(userCreatedEvent, 'ru');
    expect(out).toContain('MANAGER');
    expect(out).toMatch(/Войдите/);
  });
});

describe('renderUserPasswordReset', () => {
  it('should_produce_reset_specific_wording', () => {
    const event = { ...userCreatedEvent, resetByUserId: 'admin-2' };
    const out = renderUserPasswordReset(event, 'uz');
    expect(out).toMatch(/parolingiz/i);
    expect(out).toContain('Some\\_P@ss\\-word\\!');
  });
});

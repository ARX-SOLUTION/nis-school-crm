import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import type { LinkCodeService } from './services/link-code.service';
import { TelegramUpdate } from './telegram.update';

type ReplyCtx = {
  chat: { id: number } | undefined;
  message: { text: string } | undefined;
  reply: jest.Mock;
};

const makeCtx = (chatId: number | null, text?: string): ReplyCtx => ({
  chat: chatId === null ? undefined : { id: chatId },
  message: text !== undefined ? { text } : undefined,
  reply: jest.fn().mockResolvedValue(undefined),
});

describe('TelegramUpdate', () => {
  const build = () => {
    const users = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    } as unknown as Repository<User>;
    const linkCodes = { consume: jest.fn() } as unknown as LinkCodeService;
    const update = new TelegramUpdate(users, linkCodes);
    return {
      update,
      users: users as unknown as { findOne: jest.Mock; update: jest.Mock },
      linkCodes: linkCodes as unknown as { consume: jest.Mock },
    };
  };

  it('should_greet_linked_user_on_start', async () => {
    const { update, users } = build();
    users.findOne.mockResolvedValue({ fullName: 'Ali Valiyev' });
    const ctx = makeCtx(42);
    await update.onStart(ctx as never);
    expect(ctx.reply.mock.calls[0]?.[0]).toContain('Ali Valiyev');
  });

  it('should_prompt_to_link_when_unknown_chat_starts', async () => {
    const { update, users } = build();
    users.findOne.mockResolvedValue(null);
    const ctx = makeCtx(99);
    await update.onStart(ctx as never);
    expect(ctx.reply.mock.calls[0]?.[0]).toContain('/link');
  });

  it('should_reject_link_without_code', async () => {
    const { update, linkCodes } = build();
    const ctx = makeCtx(42, '/link');
    await update.onLink(ctx as never);
    expect(linkCodes.consume).not.toHaveBeenCalled();
    expect(ctx.reply.mock.calls[0]?.[0]).toContain('kodni');
  });

  it('should_bind_chat_id_when_code_valid', async () => {
    const { update, users, linkCodes } = build();
    linkCodes.consume.mockResolvedValue('user-1');
    users.findOne.mockResolvedValue({ fullName: 'Ali' });
    const ctx = makeCtx(42, '/link 123456');
    await update.onLink(ctx as never);
    expect(linkCodes.consume).toHaveBeenCalledWith('123456');
    expect(users.update).toHaveBeenCalledWith({ id: 'user-1' }, { telegramChatId: '42' });
  });

  it('should_surface_invalid_code', async () => {
    const { update, users, linkCodes } = build();
    linkCodes.consume.mockResolvedValue(null);
    const ctx = makeCtx(42, '/link 999999');
    await update.onLink(ctx as never);
    expect(users.update).not.toHaveBeenCalled();
    expect(ctx.reply.mock.calls[0]?.[0]).toMatch(/noto'g'ri|tugagan/i);
  });

  it('should_render_me_for_linked_user', async () => {
    const { update, users } = build();
    users.findOne.mockResolvedValue({
      fullName: 'Ali',
      email: 'ali@nis.uz',
      role: 'TEACHER',
      isActive: true,
    });
    const ctx = makeCtx(42);
    await update.onMe(ctx as never);
    const reply = ctx.reply.mock.calls[0]?.[0] as string;
    expect(reply).toContain('Ali');
    expect(reply).toContain('ali@nis.uz');
    expect(reply).toContain('TEACHER');
  });

  it('should_tell_unlinked_user_on_me', async () => {
    const { update, users } = build();
    users.findOne.mockResolvedValue(null);
    const ctx = makeCtx(42);
    await update.onMe(ctx as never);
    expect(ctx.reply.mock.calls[0]?.[0]).toContain('/link');
  });

  it('should_clear_binding_on_unlink', async () => {
    const { update, users } = build();
    users.findOne.mockResolvedValue({ id: 'user-1' });
    const ctx = makeCtx(42);
    await update.onUnlink(ctx as never);
    expect(users.update).toHaveBeenCalledWith({ id: 'user-1' }, { telegramChatId: null });
  });
});

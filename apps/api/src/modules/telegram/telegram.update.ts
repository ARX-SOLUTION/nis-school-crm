import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Command, Ctx, Help, Start, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { User } from '../users/entities/user.entity';
import { LinkCodeService } from './services/link-code.service';

/**
 * nestjs-telegraf `@Update()` registers this class as the top-level update
 * handler. The bot itself is configured at module registration time; the
 * handlers here only fire when the Telegraf connection has been launched.
 * When `TELEGRAM_BOT_TOKEN` is empty this class still loads for DI but the
 * bot never connects, so handlers simply never trigger.
 */
@Update()
@Injectable()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly linkCodes: LinkCodeService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    const existing = chatId
      ? await this.users.findOne({ where: { telegramChatId: String(chatId) } })
      : null;
    if (existing) {
      await ctx.reply(
        `Assalomu alaykum, ${existing.fullName}! Siz allaqachon bog'langansiz.\n` +
          `/me — profil, /help — yordam`,
      );
      return;
    }
    await ctx.reply(
      'Assalomu alaykum! Men NIS School CRM botiman.\n\n' +
        '1. CRM’ga kiring va profil sahifasida 6 xonali bog‘lash kodini oling.\n' +
        '2. Bu yerda /link 123456 deb yuboring.\n\n' +
        'Yordam: /help',
    );
  }

  @Help()
  async onHelp(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      '/start — botni ishga tushirish\n' +
        '/link 123456 — akkauntni CRM bilan bog‘lash\n' +
        '/me — profil ma‘lumotlari\n' +
        '/unlink — bog‘lashni bekor qilish\n' +
        '/help — ushbu yordam',
    );
  }

  @Command('link')
  async onLink(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const msg = ctx.message as { text?: string } | undefined;
    const parts = (msg?.text ?? '').trim().split(/\s+/);
    const code = parts[1];
    if (!code) {
      await ctx.reply('Iltimos kodni kiriting: /link 123456');
      return;
    }
    const userId = await this.linkCodes.consume(code);
    if (!userId) {
      await ctx.reply("Kod noto'g'ri yoki muddati tugagan.");
      return;
    }
    await this.users.update({ id: userId }, { telegramChatId: String(chatId) });
    const user = await this.users.findOne({ where: { id: userId } });
    await ctx.reply(
      `Tayyor! ${user?.fullName ?? ''} akkaunti muvaffaqiyatli bog‘landi.\n/me — profil`,
    );
  }

  @Command('me')
  async onMe(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const user = await this.users.findOne({ where: { telegramChatId: String(chatId) } });
    if (!user) {
      await ctx.reply("Siz hali bog'lanmagansiz. /link KODNI orqali bog'laning.");
      return;
    }
    await ctx.reply(
      `F.I.O: ${user.fullName}\n` +
        `Email: ${user.email}\n` +
        `Rol: ${user.role}\n` +
        (user.isActive ? 'Holat: Aktiv' : "Holat: O'chirilgan"),
    );
  }

  @Command('unlink')
  async onUnlink(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const user = await this.users.findOne({ where: { telegramChatId: String(chatId) } });
    if (!user) {
      await ctx.reply("Bu chat hech bir foydalanuvchi bilan bog'lanmagan.");
      return;
    }
    await this.users.update({ id: user.id }, { telegramChatId: null });
    await ctx.reply("Bog'lash bekor qilindi.");
  }
}

import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf, type Context } from 'telegraf';
import { User } from '../users/entities/user.entity';
import { LinkCodeService } from './services/link-code.service';

/**
 * Thin wrapper around Telegraf. Boots only when `TELEGRAM_BOT_TOKEN` is
 * present so local dev without a token still runs.
 */
@Injectable()
export class TelegramBotService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot?: Telegraf;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly linkCodes: LinkCodeService,
  ) {}

  isEnabled(): boolean {
    return this.bot !== undefined;
  }

  async onApplicationBootstrap(): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is empty — bot disabled in this environment.');
      return;
    }

    const bot = new Telegraf(token);
    bot.start((ctx) => this.onStart(ctx));
    bot.help((ctx) => this.onHelp(ctx));
    bot.command('link', (ctx) => this.onLink(ctx));
    bot.command('me', (ctx) => this.onMe(ctx));
    bot.command('unlink', (ctx) => this.onUnlink(ctx));
    bot.catch((err, ctx) => {
      this.logger.error(
        `bot error on update ${ctx.update.update_id}: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    });

    this.bot = bot;
    void bot.launch().catch((err: unknown) => {
      const reason = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`Telegraf launch failed: ${reason}`);
    });
    this.logger.log('Telegram bot launched (long-polling)');
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.bot) return;
    this.bot.stop('SIGTERM');
  }

  async sendMarkdown(chatId: string, text: string): Promise<boolean> {
    if (!this.bot) return false;
    try {
      await this.bot.telegram.sendMessage(chatId, text, { parse_mode: 'MarkdownV2' });
      return true;
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      this.logger.warn(`sendMessage to ${chatId} failed: ${reason}`);
      // If the user blocked the bot (403), flag the binding inactive so we
      // don't keep spamming a dead channel. Other errors bubble up to the
      // queue retry/DLQ.
      if (/403/.test(reason) || /blocked/i.test(reason)) {
        await this.clearBindingByChatId(chatId).catch(() => undefined);
        return false;
      }
      throw err;
    }
  }

  private async onStart(ctx: Context): Promise<void> {
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

  private async onHelp(ctx: Context): Promise<void> {
    await ctx.reply(
      '/start — botni ishga tushirish\n' +
        '/link 123456 — akkauntni CRM bilan bog‘lash\n' +
        '/me — profil ma‘lumotlari\n' +
        '/unlink — bog‘lashni bekor qilish\n' +
        '/help — ushbu yordam',
    );
  }

  private async onLink(ctx: Context): Promise<void> {
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

  private async onMe(ctx: Context): Promise<void> {
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

  private async onUnlink(ctx: Context): Promise<void> {
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

  private async clearBindingByChatId(chatId: string): Promise<void> {
    await this.users.update({ telegramChatId: chatId }, { telegramChatId: null });
  }
}

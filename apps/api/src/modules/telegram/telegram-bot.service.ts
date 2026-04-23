import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot, TELEGRAF_BOT_NAME } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';
import { User } from '../users/entities/user.entity';

/**
 * Outbound wrapper around the nestjs-telegraf-managed Telegraf instance.
 *
 * When `TELEGRAM_BOT_TOKEN` is empty at boot, TelegrafModule is NOT imported
 * (see TelegramModule) — so `@InjectBot()` would fail DI. The `@Optional`
 * wrapper makes the bot absent-safe; `isEnabled()` reports the state and
 * `sendMarkdown()` short-circuits when absent.
 */
@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    @Optional() @InjectBot() private readonly bot: Telegraf | null = null,
    @Optional() @Inject(TELEGRAF_BOT_NAME) private readonly _botName?: string,
    @InjectRepository(User) private readonly users?: Repository<User>,
  ) {
    void this._botName;
  }

  isEnabled(): boolean {
    return Boolean(this.bot);
  }

  async sendMarkdown(chatId: string, text: string): Promise<boolean> {
    if (!this.bot) return false;
    try {
      await this.bot.telegram.sendMessage(chatId, text, { parse_mode: 'MarkdownV2' });
      return true;
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      this.logger.warn(`sendMessage to ${chatId} failed: ${reason}`);
      if (/403/.test(reason) || /blocked/i.test(reason)) {
        await this.clearBindingByChatId(chatId).catch(() => undefined);
        return false;
      }
      throw err;
    }
  }

  private async clearBindingByChatId(chatId: string): Promise<void> {
    if (!this.users) return;
    await this.users.update({ telegramChatId: chatId }, { telegramChatId: null });
  }
}

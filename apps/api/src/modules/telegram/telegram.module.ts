import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';
import { User } from '../users/entities/user.entity';
import { LinkCodeService } from './services/link-code.service';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramController } from './telegram.controller';
import { TelegramNotificationConsumer } from './telegram-notification.consumer';
import { TelegramRateLimitService } from './services/telegram-rate-limit.service';
import { TelegramUpdate } from './telegram.update';

/**
 * TelegramModule is a `DynamicModule` so TelegrafModule is imported only
 * when `TELEGRAM_BOT_TOKEN` is present at boot. Without a token the Update
 * class still loads (handlers never fire) and `TelegramBotService.isEnabled`
 * returns false — outbound sends short-circuit.
 *
 * We check `process.env` rather than going through ConfigService here because
 * module imports must resolve synchronously at class-decoration time.
 */
@Module({})
export class TelegramModule {
  static forRoot(): DynamicModule {
    const logger = new Logger(TelegramModule.name);
    const token = process.env['TELEGRAM_BOT_TOKEN']?.trim();
    const botImports: DynamicModule['imports'] = token
      ? [
          TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              token: config.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
            }),
          }),
        ]
      : [];

    if (!token) {
      logger.warn('TELEGRAM_BOT_TOKEN empty — Telegraf module disabled in this environment.');
    }

    return {
      module: TelegramModule,
      imports: [TypeOrmModule.forFeature([User]), ...botImports],
      controllers: [TelegramController],
      providers: [
        LinkCodeService,
        TelegramRateLimitService,
        TelegramBotService,
        TelegramNotificationConsumer,
        TelegramUpdate,
      ],
      exports: [TelegramBotService],
    };
  }
}

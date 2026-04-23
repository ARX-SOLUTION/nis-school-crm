import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { LinkCodeService } from './services/link-code.service';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramController } from './telegram.controller';
import { TelegramNotificationConsumer } from './telegram-notification.consumer';
import { TelegramRateLimitService } from './services/telegram-rate-limit.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [TelegramController],
  providers: [
    LinkCodeService,
    TelegramRateLimitService,
    TelegramBotService,
    TelegramNotificationConsumer,
  ],
  exports: [TelegramBotService],
})
export class TelegramModule {}

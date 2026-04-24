import { ApiExtraModels } from '@nestjs/swagger';
import { TelegramAuthDto } from './telegram-auth.dto';

/**
 * Request DTO for POST /auth/telegram/link.
 *
 * Identical shape to TelegramAuthDto — subclass gives the two routes
 * distinct Swagger schema names while sharing all validation rules.
 */
@ApiExtraModels()
export class TelegramLinkDto extends TelegramAuthDto {}

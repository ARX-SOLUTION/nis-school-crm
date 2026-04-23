import { Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { LinkCodeResponseDto } from './dto/link-code-response.dto';
import { LinkCodeService } from './services/link-code.service';

@ApiTags('Telegram')
@ApiBearerAuth()
@Controller({ path: 'telegram', version: ['1'] })
export class TelegramController {
  constructor(private readonly linkCodes: LinkCodeService) {}

  @Post('link-code')
  @ApiOperation({
    summary:
      'Generate a 6-digit bot link code for the caller. Expires in 10 minutes and is single-use.',
  })
  async linkCode(@CurrentUser() user: AuthenticatedUser): Promise<LinkCodeResponseDto> {
    return this.linkCodes.generate(user.id);
  }
}

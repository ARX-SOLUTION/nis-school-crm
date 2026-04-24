import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, Matches, ValidateNested } from 'class-validator';
import { TelegramAuthDto } from './telegram-auth.dto';

export class AcceptParentInviteDto {
  @ApiProperty({
    description: 'Single-use invite token (64 lowercase hex chars)',
    example: 'a3f1c2d4e5b6a7f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'inviteToken must be exactly 64 lowercase hexadecimal characters',
  })
  inviteToken!: string;

  @ApiProperty({
    description: 'Telegram Login Widget payload for the parent accepting the invite',
    type: TelegramAuthDto,
  })
  @ValidateNested()
  @Type(() => TelegramAuthDto)
  telegramAuthData!: TelegramAuthDto;
}

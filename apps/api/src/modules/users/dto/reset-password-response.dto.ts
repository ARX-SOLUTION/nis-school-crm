import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({ description: 'Whether the user has been notified via Telegram' })
  notified!: boolean;

  @ApiProperty({
    description:
      'The newly generated password. Returned ONCE in the response so the admin ' +
      'can deliver it manually if Telegram delivery is unavailable.',
  })
  generatedPassword!: string;
}

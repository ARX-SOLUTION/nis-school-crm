import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class CreateUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({
    description:
      'The newly generated password. Returned ONCE in this response so the ' +
      'creator can deliver it manually if Telegram delivery is unavailable. ' +
      'Never persisted in plaintext.',
  })
  generatedPassword!: string;

  @ApiProperty({
    description: 'Whether a Telegram chat is already linked for delivery.',
  })
  notified!: boolean;
}

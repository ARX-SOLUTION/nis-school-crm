import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  oldPassword!: string;

  @ApiProperty({ minLength: 12, description: 'New password — must be at least 12 characters' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}

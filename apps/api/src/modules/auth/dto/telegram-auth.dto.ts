import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, IsUrl, Length, Matches } from 'class-validator';

/**
 * Mirrors the payload emitted by the Telegram Login Widget.
 * Field names are snake_case because the HMAC hash was computed over those
 * exact key names — renaming them would break hash verification.
 */
export class TelegramAuthDto {
  @ApiProperty({
    description: 'Telegram user ID',
    example: 123456789,
  })
  @IsInt()
  @IsPositive()
  id!: number;

  @ApiProperty({
    description: 'Telegram first name',
    example: 'Alisher',
  })
  @IsString()
  @Length(1, 64)
  first_name!: string;

  @ApiPropertyOptional({
    description: 'Telegram last name',
    example: 'Karimov',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  last_name?: string;

  @ApiPropertyOptional({
    description: 'Telegram username (5–32 alphanumeric chars or underscores)',
    example: 'alisher_k',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_]{5,32}$/, {
    message: 'username must be 5–32 characters: letters, digits, or underscores',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'URL of the Telegram profile photo',
    example: 'https://t.me/i/userpic/320/alisher_k.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  photo_url?: string;

  @ApiProperty({
    description: 'Unix timestamp when the Telegram widget auth was completed',
    example: 1714000000,
  })
  @IsInt()
  @IsPositive()
  auth_date!: number;

  @ApiProperty({
    description: 'HMAC-SHA-256 hash (64 lowercase hex chars) over the widget payload',
    example: 'a3f1c2d4e5b6a7f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'hash must be exactly 64 lowercase hexadecimal characters',
  })
  hash!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@nis.uz', description: 'User email' })
  @IsEmail()
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  // 8-char minimum here lets legacy passwords still log in. The 12-char
  // minimum lives in ChangePasswordDto so newly-set passwords meet the
  // stronger policy.
  @ApiProperty({ example: 'CorrectHorseBatteryStaple', description: 'User password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

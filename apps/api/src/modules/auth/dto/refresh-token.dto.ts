import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Opaque refresh token previously issued by /auth/login' })
  @IsString()
  @MinLength(32)
  @MaxLength(512)
  refreshToken!: string;
}

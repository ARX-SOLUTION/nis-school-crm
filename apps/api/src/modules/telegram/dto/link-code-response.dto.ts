import { ApiProperty } from '@nestjs/swagger';

export class LinkCodeResponseDto {
  @ApiProperty({ example: '123456' })
  code!: string;

  @ApiProperty({ example: 600 })
  expiresInSeconds!: number;
}

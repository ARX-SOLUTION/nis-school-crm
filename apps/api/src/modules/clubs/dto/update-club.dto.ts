import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ClubStatus } from '@nis/shared';
import { CreateClubDto } from './create-club.dto';

export class UpdateClubDto extends PartialType(CreateClubDto) {
  @ApiPropertyOptional({ enum: ClubStatus, example: ClubStatus.ACTIVE })
  @IsEnum(ClubStatus)
  @IsOptional()
  status?: ClubStatus;
}

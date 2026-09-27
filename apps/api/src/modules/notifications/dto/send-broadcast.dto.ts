import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  NOTIFICATION_TARGETS,
  type NotificationTarget,
  type SendBroadcastRequestDto,
} from '@nis/shared';

export class SendBroadcastDto implements SendBroadcastRequestDto {
  @ApiProperty({ example: 'Ota-onalar majlisi' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Hurmatli ota-onalar, shanba kuni soat 10:00 da...' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({ enum: NOTIFICATION_TARGETS, example: 'ALL_PARENTS' })
  @IsEnum(NOTIFICATION_TARGETS)
  target!: NotificationTarget;

  @ApiProperty({ required: false, example: 'UUID' })
  @IsUUID()
  @IsOptional()
  classId?: string;
}

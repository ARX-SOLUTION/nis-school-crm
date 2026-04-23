import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { ROOM_TYPES, RoomType } from '@nis/shared';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Short display label for the room',
    example: '201',
  })
  @IsString()
  @Length(1, 20)
  roomNumber!: string;

  @ApiPropertyOptional({ description: 'Optional longer descriptive name', example: 'Physics Lab' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Maximum student capacity',
    example: 30,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsInt()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Room type',
    example: 'CLASSROOM',
    enum: ROOM_TYPES,
  })
  @IsOptional()
  @IsIn(ROOM_TYPES)
  type?: RoomType;

  @ApiPropertyOptional({ description: 'Floor number', example: 2 })
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiPropertyOptional({ description: 'Whether the room is active in scheduling', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RoomType } from '@nis/shared';
import { Room } from '../entities/room.entity';

export class RoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Short room label', example: '201' })
  roomNumber!: string;

  @ApiPropertyOptional({ description: 'Descriptive name', example: 'Physics Lab', nullable: true })
  name!: string | null;

  @ApiProperty({ description: 'Maximum student capacity', example: 30 })
  capacity!: number;

  @ApiProperty({ description: 'Room type', example: 'CLASSROOM' })
  type!: RoomType;

  @ApiPropertyOptional({ description: 'Floor number', nullable: true })
  floor!: number | null;

  @ApiProperty({ description: 'Whether the room is active' })
  isActive!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(entity: Room): RoomResponseDto {
    const dto = new RoomResponseDto();
    dto.id = entity.id;
    dto.roomNumber = entity.roomNumber;
    dto.name = entity.name;
    dto.capacity = entity.capacity;
    dto.type = entity.type;
    dto.floor = entity.floor;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

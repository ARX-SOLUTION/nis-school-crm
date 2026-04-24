import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class RoomAvailabilityQueryDto {
  @ApiProperty({
    description: 'Date to check availability for (YYYY-MM-DD)',
    example: '2026-09-15',
  })
  @IsString()
  @IsDateString()
  date!: string;
}

export class RoomConflictDto {
  @ApiProperty({
    description: 'Conflict start time (ISO string)',
    example: '2026-09-15T09:00:00.000Z',
  })
  from!: string;

  @ApiProperty({
    description: 'Conflict end time (ISO string)',
    example: '2026-09-15T10:00:00.000Z',
  })
  to!: string;
}

export class RoomAvailabilityDto {
  @ApiProperty({ format: 'uuid', description: 'Room UUID' })
  roomId!: string;

  @ApiProperty({ description: 'Date checked', example: '2026-09-15' })
  date!: string;

  @ApiProperty({ description: 'Whether the room has no conflicts on the given date' })
  available!: boolean;

  @ApiProperty({
    type: [RoomConflictDto],
    description: 'List of scheduling conflicts (empty until Week 4)',
  })
  conflicts!: RoomConflictDto[];
}

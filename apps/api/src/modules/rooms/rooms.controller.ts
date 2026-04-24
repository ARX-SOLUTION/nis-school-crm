import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto, PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { RoleName } from '../../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomAvailabilityDto, RoomAvailabilityQueryDto } from './dto/room-availability.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

class RoomsListResponseDto extends PaginatedResponseDto<RoomResponseDto> {
  declare data: RoomResponseDto[];
  declare meta: PaginationMetaDto;
}

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller({ path: 'rooms', version: ['1'] })
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Create a room' })
  @ApiResponse({ status: 201, type: RoomResponseDto })
  async create(@Body() dto: CreateRoomDto): Promise<RoomResponseDto> {
    return RoomResponseDto.fromEntity(await this.rooms.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'List rooms (paginated, filterable by search / type / active)' })
  @ApiResponse({ status: 200, type: RoomsListResponseDto })
  async list(@Query() query: RoomsQueryDto): Promise<RoomsListResponseDto> {
    const page = await this.rooms.list(query);
    return RoomsListResponseDto.of(
      page.data.map((r) => RoomResponseDto.fromEntity(r)),
      page.meta,
    ) as RoomsListResponseDto;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room by ID' })
  @ApiResponse({ status: 200, type: RoomResponseDto })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<RoomResponseDto> {
    return RoomResponseDto.fromEntity(await this.rooms.getById(id));
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Partially update a room' })
  @ApiResponse({ status: 200, type: RoomResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    return RoomResponseDto.fromEntity(await this.rooms.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a room (preserves scheduling history)' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.rooms.softDelete(id);
  }

  /**
   * Availability stub — full conflict detection arrives in Week 4 (Schedule module).
   * Returns { available: true, conflicts: [] } for all valid rooms until then.
   */
  @Get(':id/availability')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({
    summary: 'Check room availability for a date (stub — full implementation in Week 4)',
  })
  @ApiResponse({ status: 200, type: RoomAvailabilityDto })
  async availability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RoomAvailabilityQueryDto,
  ): Promise<RoomAvailabilityDto> {
    return this.rooms.availabilityOn(id, query.date);
  }
}

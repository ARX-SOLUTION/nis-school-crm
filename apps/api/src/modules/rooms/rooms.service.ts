import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { RoomAvailabilityDto } from './dto/room-availability.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
  ) {}

  async create(dto: CreateRoomDto): Promise<Room> {
    try {
      return await this.rooms.save(
        this.rooms.create({
          roomNumber: dto.roomNumber,
          name: dto.name ?? null,
          capacity: dto.capacity ?? 30,
          type: dto.type ?? 'CLASSROOM',
          floor: dto.floor ?? null,
          isActive: dto.isActive ?? true,
        }),
      );
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException('Room number already exists');
      }
      throw err;
    }
  }

  async list(query: RoomsQueryDto): Promise<PaginatedResponseDto<Room>> {
    const qb = this.rooms.createQueryBuilder('r');

    if (query.search) {
      qb.andWhere('(LOWER(r.room_number) LIKE :search OR LOWER(r.name) LIKE :search)', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }
    if (query.type !== undefined) {
      qb.andWhere('r.type = :type', { type: query.type });
    }
    if (query.active !== undefined) {
      qb.andWhere('r.is_active = :active', { active: query.active });
    }

    qb.orderBy('r.room_number', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(
      data,
      PaginatedResponseDto.buildMeta(total, query.page, query.limit),
    );
  }

  async getById(id: string): Promise<Room> {
    const entity = await this.rooms.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Room not found');
    return entity;
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const entity = await this.getById(id);
    Object.assign(entity, {
      ...(dto.roomNumber !== undefined ? { roomNumber: dto.roomNumber } : {}),
      ...(dto.name !== undefined ? { name: dto.name ?? null } : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.floor !== undefined ? { floor: dto.floor ?? null } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    try {
      return await this.rooms.save(entity);
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException('Room number already exists');
      }
      throw err;
    }
  }

  async softDelete(id: string): Promise<void> {
    const entity = await this.getById(id);
    await this.rooms.softDelete({ id: entity.id });
  }

  /**
   * Returns availability of a room on a given date.
   * Full schedule conflict detection is implemented in Week 4 (Schedule module).
   * Until then this method always returns available=true with an empty conflicts array.
   */
  async availabilityOn(roomId: string, date: string): Promise<RoomAvailabilityDto> {
    await this.getById(roomId); // 404 if room not found
    return { roomId, date, available: true, conflicts: [] };
  }

  private isUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const candidate = err as unknown as { code?: unknown };
    return typeof candidate.code === 'string' && candidate.code === PG_UNIQUE_VIOLATION;
  }
}

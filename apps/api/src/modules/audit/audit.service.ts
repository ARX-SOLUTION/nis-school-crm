import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AuditLog } from './entities/audit-log.entity';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly logs: Repository<AuditLog>,
  ) {}

  async record(data: Partial<AuditLog>): Promise<AuditLog> {
    return this.logs.save(this.logs.create(data));
  }

  async list(query: AuditQueryDto): Promise<PaginatedResponseDto<AuditLog>> {
    const qb = this.logs.createQueryBuilder('a');
    if (query.userId) qb.andWhere('a.user_id = :uid', { uid: query.userId });
    if (query.action) qb.andWhere('a.action = :action', { action: query.action });
    if (query.entityType) {
      qb.andWhere('a.entity_type = :et', { et: query.entityType });
    }
    if (query.from && query.to) {
      qb.andWhere('a.created_at BETWEEN :from AND :to', {
        from: new Date(query.from),
        to: new Date(query.to),
      });
    } else if (query.from) {
      qb.andWhere('a.created_at >= :from', { from: new Date(query.from) });
    } else if (query.to) {
      qb.andWhere('a.created_at <= :to', { to: new Date(query.to) });
    }
    qb.orderBy('a.created_at', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(
      data,
      PaginatedResponseDto.buildMeta(total, query.page, query.limit),
    );
  }

  async recent(limit = 10): Promise<AuditLog[]> {
    return this.logs.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}

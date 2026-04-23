import { ApiProperty } from '@nestjs/swagger';
import { AuditLog } from '../entities/audit-log.entity';

export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiProperty()
  action!: string;

  @ApiProperty({ nullable: true })
  entityType!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  entityId!: string | null;

  @ApiProperty({ nullable: true })
  ipAddress!: string | null;

  @ApiProperty({ nullable: true })
  statusCode!: number | null;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  oldData!: Record<string, unknown> | null;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  newData!: Record<string, unknown> | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  static fromEntity(entity: AuditLog): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.action = entity.action;
    dto.entityType = entity.entityType;
    dto.entityId = entity.entityId;
    dto.ipAddress = entity.ipAddress;
    dto.statusCode = entity.statusCode;
    dto.oldData = entity.oldData;
    dto.newData = entity.newData;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}

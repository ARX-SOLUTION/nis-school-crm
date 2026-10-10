import type { AuditLogResponseDto, AuditQueryDto, PaginatedResponse } from '@nis/shared';
import { api } from '@/lib/api';

export const auditApi = {
  list: (params?: AuditQueryDto): Promise<PaginatedResponse<AuditLogResponseDto>> =>
    api.get<PaginatedResponse<AuditLogResponseDto>>('/audit-logs', { params }).then((r) => r.data),
};

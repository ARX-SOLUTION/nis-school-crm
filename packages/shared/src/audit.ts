export interface AuditLogResponseDto {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  statusCode: number | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditQueryDto {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

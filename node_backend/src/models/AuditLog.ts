export interface AuditLog {
  uuid: string;
  actorType: 'user' | 'system' | 'anonymous';
  actorUuid: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRoles: string[];
  action: string;
  resource: string;
  resourceUuid: string | null;
  resourceName: string | null;
  httpMethod: string;
  endpoint: string;
  statusCode: number;
  success: boolean;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  sessionUuid: string | null;
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface CreateAuditLogDTO {
  actorType: 'user' | 'system' | 'anonymous';
  actorUuid: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRoles: string[];
  action: string;
  resource: string;
  resourceUuid: string | null;
  resourceName: string | null;
  httpMethod: string;
  endpoint: string;
  statusCode: number;
  success: boolean;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  sessionUuid: string | null;
  durationMs: number;
  errorMessage: string | null;
}

export interface Session {
  uuid: string;
  userId: number;
  sessionToken: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthIdentity {
  id: number;
  userId: number;
  provider: 'local' | 'google' | 'github';
  providerUserId: string;
  createdAt: string;
}

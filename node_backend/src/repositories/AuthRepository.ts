import db from '../config/database.js';
import { Session, AuthIdentity } from '../models/Session.js';
import { generateUuidV7 } from '../utils/uuid.js';
import { nowDb } from '../utils/time.js';

export class AuthRepository {
  private readonly sessionsTable = 'sessions';
  private readonly identitiesTable = 'user_identities';

  async createSession(data: { userId: number; sessionToken: string; expiresAt: string; ipAddress?: string; userAgent?: string; deviceId?: string; deviceName?: string }): Promise<Session> {
    const uuid = generateUuidV7();
    const now = nowDb();
    
    const sessionData = {
      uuid,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await db(this.sessionsTable).insert(sessionData);
    
    return db(this.sessionsTable).where('uuid', uuid).first();
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    return db(this.sessionsTable)
      .where('sessionToken', token)
      .andWhere('expiresAt', '>', nowDb())
      .first();
  }

  async countActiveSessions(userId: number): Promise<number> {
    const result = await db(this.sessionsTable)
      .where('userId', userId)
      .andWhere('expiresAt', '>', nowDb())
      .count('* as total')
      .first();
    return Number(result?.total || 0);
  }

  async getSessionsByUserId(userId: number): Promise<Session[]> {
    return db(this.sessionsTable)
      .where('userId', userId)
      .andWhere('expiresAt', '>', nowDb())
      .orderBy('createdAt', 'desc');
  }

  async deleteSessionByToken(token: string): Promise<boolean> {
    const result = await db(this.sessionsTable).where('sessionToken', token).del();
    return result > 0;
  }

  async deleteSessionByUuid(uuid: string, userId: number): Promise<boolean> {
    const result = await db(this.sessionsTable)
      .where({ uuid, userId })
      .del();
    return result > 0;
  }

  async deleteExpiredSessions(): Promise<number> {
    return db(this.sessionsTable).where('expiresAt', '<', nowDb()).del();
  }

  async createIdentity(userId: number, provider: string, providerUserId: string): Promise<void> {
    await db(this.identitiesTable).insert({
      userId,
      provider,
      providerUserId,
      createdAt: nowDb()
    });
  }

  async findIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | null> {
    return db(this.identitiesTable)
      .where({ provider, providerUserId })
      .first();
  }
}

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuthRepository } from '../repositories/AuthRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';

export class AuthService {
  private readonly MAX_SESSIONS = 3;

  constructor(
    private authRepo: AuthRepository,
    private userRepo: UserRepository
  ) {}

  async login(identifier: string, password: string, deviceInfo?: { deviceId?: string; deviceName?: string; ipAddress?: string; userAgent?: string }): Promise<{ user: User; session: Session }> {
    const userWithPassword = await this.userRepo.findByIdentifierWithPassword(identifier);

    if (!userWithPassword) {
      const error = new Error('Invalid credentials');
      (error as any).status = 401;
      throw error;
    }

    if (userWithPassword.status === 'blocked') {
      const error = new Error('Your account is blocked. Please contact support.');
      (error as any).status = 403;
      throw error;
    }
    
    if (userWithPassword.status === 'deleted') {
      const error = new Error('Your account has been deleted.');
      (error as any).status = 403;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);

    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      (error as any).status = 401;
      throw error;
    }

    // Check session limit
    const activeSessionsCount = await this.authRepo.countActiveSessions(userWithPassword.id);
    const sessionLimit = userWithPassword.sessionLimit || this.MAX_SESSIONS;
    
    if (activeSessionsCount >= sessionLimit) {
      const activeSessions = await this.authRepo.getSessionsByUserId(userWithPassword.id);
      
      // Generate a short-lived management token
      const mgmtToken = crypto.randomBytes(32).toString('hex');
      const mgmtExpiresAt = new Date();
      mgmtExpiresAt.setMinutes(mgmtExpiresAt.getMinutes() + 10); // 10 minutes limit

      console.log(`[AuthService] Session limit reached for user ${userWithPassword.id}. Limit: ${sessionLimit}. Creating mgmt token.`);

      // Store in a temporary session that only allows management
      await this.authRepo.createSession({
        ...deviceInfo,
        userId: userWithPassword.id,
        sessionToken: mgmtToken,
        expiresAt: mgmtExpiresAt,
        deviceName: 'Session Management',
        deviceId: 'mgmt-only'
      });

      const error = new Error('Session limit reached. Please logout from another device.');
      (error as any).status = 403;
      (error as any).code = 'SESSION_LIMIT_REACHED';
      (error as any).activeSessions = activeSessions.map(s => ({
        uuid: s.uuid,
        deviceName: s.deviceName || 'Unknown Device',
        lastActive: s.createdAt
      }));
      (error as any).mgmtToken = mgmtToken;
      (error as any).sessionLimit = sessionLimit;
      throw error;
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

    const session = await this.authRepo.createSession({
      userId: userWithPassword.id,
      sessionToken,
      expiresAt: expiresAt,
      ...deviceInfo
    });

    const user = await this.userRepo.findByUuid(userWithPassword.uuid);
    return { user: user!, session };
  }

  async logout(token: string): Promise<void> {
    await this.authRepo.deleteSessionByToken(token);
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return this.authRepo.getSessionsByUserId(userId);
  }

  async terminateSession(uuid: string, userId: number): Promise<boolean> {
    return this.authRepo.deleteSessionByUuid(uuid, userId);
  }

  async validateSession(token: string): Promise<User | null> {
    const session = await this.authRepo.findSessionByToken(token);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const userIdInternal = session.userId;
    return this.userRepo.findById(userIdInternal);
  }

  /**
   * Validate a management token (short-lived, mgmt-only).
   * Unlike validateSession, this one is specifically for tokens used during session management flows.
   */
  async validateMgmtToken(token: string): Promise<User | null> {
    const session = await this.authRepo.findSessionByToken(token);
    if (!session) {
      console.log(`[AuthService] Mgmt token not found or expired in DB.`);
      return null;
    }
    
    if (session.deviceId !== 'mgmt-only') {
      console.log(`[AuthService] Mgmt token rejected: Incorrect deviceId ${session.deviceId}.`);
      return null;
    }

    // Check expiration manually as fallback
    if (new Date(session.expiresAt) < new Date()) {
      console.log(`[AuthService] Mgmt token rejected: Manual expiration check failed. DB: ${session.expiresAt}, Now: ${new Date().toISOString()}`);
      return null;
    }

    return this.userRepo.findById(session.userId);
  }
}

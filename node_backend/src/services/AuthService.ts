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
    if (activeSessionsCount >= this.MAX_SESSIONS) {
      const activeSessions = await this.authRepo.getSessionsByUserId(userWithPassword.id);
      const error = new Error('Session limit reached. Please logout from another device.');
      (error as any).status = 403;
      (error as any).code = 'SESSION_LIMIT_REACHED';
      (error as any).activeSessions = activeSessions.map(s => ({
        uuid: s.uuid,
        deviceName: s.deviceName || 'Unknown Device',
        lastActive: s.createdAt
      }));
      throw error;
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

    const session = await this.authRepo.createSession({
      userId: userWithPassword.id,
      sessionToken,
      expiresAt: expiresAt.toISOString().slice(0, 19).replace('T', ' '), // Format for MySQL
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

    // Use internal ID if possible, but findByUuid is what we have for public objects
    // Actually, findByUuid is best for consistency
    const userIdInternal = session.userId;
    // We need a findById method in UserRepository
    return this.userRepo.findById(userIdInternal);
  }
}

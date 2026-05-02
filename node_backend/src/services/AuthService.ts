import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/AuthRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { User } from '../models/User.js';
import { Tenant } from '../models/Tenant.js';
import { Session } from '../models/Session.js';

export class AuthService {
  private readonly MAX_SESSIONS = 3;

  constructor(
    private authRepo: AuthRepository,
    private userRepo: UserRepository,
    private tenantRepo: TenantRepository
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
      
      // Generate a short-lived STATELESS management token
      const expiresAt = Math.floor(Date.now() / 1000) + (10 * 60); // 10 minutes from now
      const payload = `${userWithPassword.id}:${expiresAt}`;
      const secret = process.env.MGMT_TOKEN_SECRET || 'fallback-secret-for-dev-only';
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const mgmtToken = Buffer.from(`${payload}:${signature}`).toString('base64');

      console.log(`[AuthService] Session limit reached for user ${userWithPassword.id}. Limit: ${sessionLimit}. Generated stateless mgmt token.`);

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

  async validateSession(token: string): Promise<{ user: User; session: Session } | null> {
    const session = await this.authRepo.findSessionByToken(token);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user) return null;

    return { user, session };
  }

  /**
   * Validate a management token (short-lived, stateless).
   */
  async validateMgmtToken(token: string): Promise<User | null> {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [userId, expiresAt, signature] = decoded.split(':');
      
      if (!userId || !expiresAt || !signature) {
        console.log(`[AuthService] Mgmt token rejected: Invalid format.`);
        return null;
      }

      const payload = `${userId}:${expiresAt}`;
      const secret = process.env.MGMT_TOKEN_SECRET || 'fallback-secret-for-dev-only';
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      if (signature !== expectedSignature) {
        console.log(`[AuthService] Mgmt token rejected: Invalid signature.`);
        return null;
      }

      const expiryTime = parseInt(expiresAt, 10);
      if (expiryTime < Math.floor(Date.now() / 1000)) {
        console.log(`[AuthService] Mgmt token rejected: Expired.`);
        return null;
      }

      return this.userRepo.findById(parseInt(userId, 10));
    } catch (e) {
      console.error(`[AuthService] Error validating mgmt token:`, e);
      return null;
    }
  }

  // Tenant Authentication Methods
  async tenantLogin(phone: string, password: string, deviceInfo?: { deviceId?: string; deviceName?: string; ipAddress?: string; userAgent?: string }): Promise<{ tenant: Tenant; accessToken: string; refreshToken: string }> {
    const tenantWithPassword = await this.tenantRepo.findByPhoneWithPassword(phone);

    if (!tenantWithPassword) {
      const error = new Error('Invalid credentials');
      (error as any).status = 401;
      throw error;
    }

    if (tenantWithPassword.status === 'blocked' || tenantWithPassword.status === 'suspended') {
      const error = new Error(`Your account is ${tenantWithPassword.status}. Please contact support.`);
      (error as any).status = 403;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, tenantWithPassword.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid phone or password');
      (error as any).status = 401;
      throw error;
    }

    const tenant = await this.tenantRepo.findByUuid(tenantWithPassword.uuid);
    if (!tenant) throw new Error('Tenant not found');

    const accessToken = this.generateAccessToken({ id: tenant.uuid, type: 'tenant', phone: tenant.phone });
    const refreshToken = this.generateRefreshToken({ id: tenant.uuid, type: 'tenant' });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days matching JWT_REFRESH_EXPIRATION

    await this.authRepo.createTenantRefreshToken({
      tenantId: tenantWithPassword.id,
      token: refreshToken,
      expiresAt,
      ...deviceInfo
    });

    return { tenant, accessToken, refreshToken };
  }

  async refreshTenantToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await this.authRepo.findTenantRefreshToken(token);
    if (!storedToken) {
      const error = new Error('Invalid or expired refresh token');
      (error as any).status = 401;
      throw error;
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as any;
      const tenant = await this.tenantRepo.findByUuid(payload.id);
      
      if (!tenant) throw new Error('Tenant not found');

      const newAccessToken = this.generateAccessToken({ id: tenant.uuid, type: 'tenant', phone: tenant.phone });
      const newRefreshToken = this.generateRefreshToken({ id: tenant.uuid, type: 'tenant' });

      // Rotate refresh token: delete old, create new
      await this.authRepo.deleteTenantRefreshToken(token);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await this.authRepo.createTenantRefreshToken({
        tenantId: storedToken.tenantId,
        token: newRefreshToken,
        expiresAt,
        deviceId: storedToken.deviceId,
        deviceName: storedToken.deviceName,
        ipAddress: storedToken.ipAddress,
        userAgent: storedToken.userAgent
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err) {
      const error = new Error('Invalid refresh token');
      (error as any).status = 401;
      throw error;
    }
  }

  private generateAccessToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'access-secret', {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m'
    });
  }

  private generateRefreshToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d'
    });
  }
}

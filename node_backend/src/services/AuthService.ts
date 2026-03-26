import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuthRepository } from '../repositories/AuthRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';

export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private userRepo: UserRepository
  ) {}

  async login(identifier: string, password: string): Promise<{ user: User; session: Session }> {
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

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

    const session = await this.authRepo.createSession({
      userId: userWithPassword.id,
      sessionToken,
      expiresAt: expiresAt.toISOString().slice(0, 19).replace('T', ' ') // Format for MySQL
    });

    const user = await this.userRepo.findByUuid(userWithPassword.uuid);
    return { user: user!, session };
  }

  async logout(token: string): Promise<void> {
    await this.authRepo.deleteSessionByToken(token);
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

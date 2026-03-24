import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { User, UpdateUserDTO } from '../models/User.js';

export class UserService {
  private repo: UserRepository;

  constructor(repo: UserRepository) {
    this.repo = repo;
  }

  async createUser(data: { email: string; name: string; phone: string | number; password: string }): Promise<User> {
    if (await this.repo.findByPhone(data.phone)) {
      const error = new Error('Phone number is already registered');
      (error as any).status = 409;
      throw error;
    }

    if (await this.repo.findByEmail(data.email)) {
      const error = new Error('Email is already registered');
      (error as any).status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.repo.create({
      ...data,
      password: hashedPassword,
    });
  }

  async getAllUsers(filters: any = {}): Promise<{ users: User[]; total: number }> {
    return this.repo.getAll(filters);
  }

  async getUserByUuid(uuid: string): Promise<User> {
    const user = await this.repo.findByUuid(uuid);
    if (!user) {
      const error = new Error('User not found');
      (error as any).status = 404;
      throw error;
    }
    return user;
  }

  async updateUser(uuid: string, data: UpdateUserDTO): Promise<User> {
    const user = await this.getUserByUuid(uuid);
    const updateData: any = {};

    if (data.email && data.email !== user.email) {
      if (await this.repo.findByEmail(data.email)) {
        const error = new Error('Email is already registered to another user');
        (error as any).status = 409;
        throw error;
      }
      updateData.email = data.email;
    }

    if (data.phone && String(data.phone) !== String(user.phone)) {
      if (await this.repo.findByPhone(data.phone)) {
        const error = new Error('Phone number is already registered to another user');
        (error as any).status = 409;
        throw error;
      }
      updateData.phone = data.phone;
    }

    if (data.name) updateData.name = data.name;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

    if (Object.keys(updateData).length > 0) {
      await this.repo.update(uuid, updateData);
    }

    return this.getUserByUuid(uuid);
  }

  async deleteUser(uuid: string): Promise<void> {
    const user = await this.getUserByUuid(uuid);
    if (user.status !== 'active') {
      const error = new Error("User is blocked and can't be deleted");
      (error as any).status = 403;
      throw error;
    }
    await this.repo.delete(uuid);
  }

  async blockUser(uuid: string): Promise<User> {
    const user = await this.getUserByUuid(uuid);
    if (user.status === 'deleted') {
      const error = new Error('Cannot block a deleted user');
      (error as any).status = 400;
      throw error;
    }
    if (user.status === 'blocked') {
      const error = new Error('User is already blocked');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'blocked');
    return this.getUserByUuid(uuid);
  }

  async unblockUser(uuid: string): Promise<User> {
    const user = await this.getUserByUuid(uuid);
    if (user.status === 'deleted') {
      const error = new Error('Cannot unblock a deleted user');
      (error as any).status = 400;
      throw error;
    }
    if (user.status === 'active') {
      const error = new Error('User is already active');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'active');
    return this.getUserByUuid(uuid);
  }
}

import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { CountryRepository } from '../repositories/CountryRepository.js';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/User.js';

export class UserService {
  private repo: UserRepository;
  private countryRepo: CountryRepository;

  constructor(repo: UserRepository, countryRepo: CountryRepository) {
    this.repo = repo;
    this.countryRepo = countryRepo;
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    if (await this.repo.findByUsername(data.username)) {
      const error = new Error(`Username '${data.username}' is already taken`);
      (error as any).status = 409;
      throw error;
    }
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

    // Validate country
    const country = await this.countryRepo.findByUuid(data.countryUuid);
    if (!country) {
      const error = new Error('Selected country does not exist');
      (error as any).status = 404;
      throw error;
    }
    if (country.status !== 'active') {
      const error = new Error('Selected country is not active');
      (error as any).status = 400;
      throw error;
    }

    const countryId = await this.countryRepo.findIdByUuid(data.countryUuid);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.repo.create({
      ...data,
      password: hashedPassword,
      countryId, // Injected for repository
    } as any);
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

    if (data.username && data.username !== user.username) {
      if (await this.repo.findByUsername(data.username)) {
        const error = new Error(`Username '${data.username}' is already taken`);
        (error as any).status = 409;
        throw error;
      }
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

    if (data.countryUuid) {
      const country = await this.countryRepo.findByUuid(data.countryUuid);
      if (!country) {
        const error = new Error('Selected country does not exist');
        (error as any).status = 404;
        throw error;
      }
      if (country.status !== 'active') {
        const error = new Error('Selected country is not active');
        (error as any).status = 400;
        throw error;
      }
      updateData.countryId = await this.countryRepo.findIdByUuid(data.countryUuid);
    }

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

  async resetPassword(uuid: string, data: { password?: string; confirmPassword?: string }): Promise<User> {
    const user = await this.getUserByUuid(uuid);
    
    if (user.status === 'deleted') {
      const error = new Error('Cannot reset password for a deleted user');
      (error as any).status = 400;
      throw error;
    }

    const { password, confirmPassword } = data;

    if (!password || !confirmPassword) {
      const error = new Error('Password and confirmation are required');
      (error as any).status = 400;
      throw error;
    }

    if (password !== confirmPassword) {
      const error = new Error('Passwords do not match');
      (error as any).status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.repo.updatePassword(uuid, hashedPassword);

    return this.getUserByUuid(uuid);
  }
}

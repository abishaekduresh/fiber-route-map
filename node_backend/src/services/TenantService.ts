import bcrypt from 'bcryptjs';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { CountryRepository } from '../repositories/CountryRepository.js';
import db from '../config/database.js';
import { Tenant, CreateTenantDTO, UpdateTenantDTO } from '../models/Tenant.js';

export class TenantService {
  private repo: TenantRepository;
  private countryRepo: CountryRepository;

  constructor(repo: TenantRepository, countryRepo: CountryRepository) {
    this.repo = repo;
    this.countryRepo = countryRepo;
  }

  async getAllTenants(params: any = {}): Promise<{ tenants: Tenant[]; total: number }> {
    return this.repo.getAll(params);
  }

  async getTenantByUuid(uuid: string): Promise<Tenant> {
    const tenant = await this.repo.findByUuid(uuid);
    if (!tenant) {
      const error = new Error('Tenant not found');
      (error as any).status = 404;
      throw error;
    }
    return tenant;
  }

  async createTenant(data: CreateTenantDTO): Promise<Tenant> {
    if (!data.email || !data.username || !data.name || !data.address || !data.password) {
      const error = new Error('email, username, name, address, and password are required');
      (error as any).status = 400;
      throw error;
    }

    if (await this.repo.findByEmail(data.email)) {
      const error = new Error('Email is already registered');
      (error as any).status = 409;
      throw error;
    }
    if (await this.repo.findByUsername(data.username)) {
      const error = new Error(`Username '${data.username}' is already taken`);
      (error as any).status = 409;
      throw error;
    }

    let countryId: number | null = null;
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
      countryId = await this.countryRepo.findIdByUuid(data.countryUuid);
    }

    let roleId: number | null = null;
    if (data.roleUuid) {
      const row = await db('roles').where('uuid', data.roleUuid).select('id').first();
      if (!row) {
        const error = new Error('Selected role does not exist');
        (error as any).status = 404;
        throw error;
      }
      roleId = row.id;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.repo.create({
      email: data.email,
      username: data.username,
      name: data.name,
      address: data.address,
      password: hashedPassword,
      countryId,
      roleId,
    });
  }

  async updateTenant(uuid: string, data: UpdateTenantDTO): Promise<Tenant> {
    const tenant = await this.getTenantByUuid(uuid);
    if (tenant.status === 'deleted') {
      const error = new Error('Cannot update a deleted tenant');
      (error as any).status = 400;
      throw error;
    }

    if (data.email && data.email !== tenant.email) {
      if (await this.repo.findByEmail(data.email)) {
        const error = new Error('Email is already registered');
        (error as any).status = 409;
        throw error;
      }
    }
    if (data.username && data.username !== tenant.username) {
      if (await this.repo.findByUsername(data.username)) {
        const error = new Error(`Username '${data.username}' is already taken`);
        (error as any).status = 409;
        throw error;
      }
    }

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.username !== undefined) updatePayload.username = data.username;
    if (data.address !== undefined) updatePayload.address = data.address;

    if (data.countryUuid !== undefined) {
      if (data.countryUuid === null) {
        updatePayload.countryId = null;
      } else {
        const country = await this.countryRepo.findByUuid(data.countryUuid);
        if (!country) {
          const error = new Error('Selected country does not exist');
          (error as any).status = 404;
          throw error;
        }
        updatePayload.countryId = await this.countryRepo.findIdByUuid(data.countryUuid);
      }
    }

    if (data.roleUuid !== undefined) {
      if (data.roleUuid === null) {
        updatePayload.roleId = null;
      } else {
        const row = await db('roles').where('uuid', data.roleUuid).select('id').first();
        if (!row) {
          const error = new Error('Selected role does not exist');
          (error as any).status = 404;
          throw error;
        }
        updatePayload.roleId = row.id;
      }
    }

    await this.repo.update(uuid, updatePayload);
    return this.getTenantByUuid(uuid);
  }

  async deleteTenant(uuid: string): Promise<void> {
    const tenant = await this.getTenantByUuid(uuid);
    if (tenant.status !== 'active') {
      const error = new Error(`Cannot delete a ${tenant.status} tenant`);
      (error as any).status = 400;
      throw error;
    }
    await this.repo.delete(uuid);
  }

  async blockTenant(uuid: string): Promise<Tenant> {
    const tenant = await this.getTenantByUuid(uuid);
    if (tenant.status === 'deleted') {
      const error = new Error('Cannot block a deleted tenant');
      (error as any).status = 400;
      throw error;
    }
    if (tenant.status === 'blocked') {
      const error = new Error('Tenant is already blocked');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'blocked');
    return this.getTenantByUuid(uuid);
  }

  async unblockTenant(uuid: string): Promise<Tenant> {
    const tenant = await this.getTenantByUuid(uuid);
    if (tenant.status === 'deleted') {
      const error = new Error('Cannot unblock a deleted tenant');
      (error as any).status = 400;
      throw error;
    }
    if (tenant.status === 'active') {
      const error = new Error('Tenant is already active');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'active');
    return this.getTenantByUuid(uuid);
  }

  async suspendTenant(uuid: string): Promise<Tenant> {
    const tenant = await this.getTenantByUuid(uuid);
    if (tenant.status === 'deleted') {
      const error = new Error('Cannot suspend a deleted tenant');
      (error as any).status = 400;
      throw error;
    }
    if (tenant.status === 'suspended') {
      const error = new Error('Tenant is already suspended');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'suspended');
    return this.getTenantByUuid(uuid);
  }
}

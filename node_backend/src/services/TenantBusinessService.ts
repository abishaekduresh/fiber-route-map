import { TenantBusinessRepository } from '../repositories/TenantBusinessRepository.js';
import { CountryRepository } from '../repositories/CountryRepository.js';
import { TenantBusiness, CreateTenantBusinessDTO, UpdateTenantBusinessDTO } from '../models/TenantBusiness.js';

export class TenantBusinessService {
  private repo: TenantBusinessRepository;
  private countryRepo: CountryRepository;

  constructor(repo: TenantBusinessRepository, countryRepo: CountryRepository) {
    this.repo = repo;
    this.countryRepo = countryRepo;
  }

  async getAllBusinesses(params: any = {}): Promise<{ businesses: TenantBusiness[]; total: number }> {
    return this.repo.getAll(params);
  }

  async getBusinessByUuid(uuid: string): Promise<TenantBusiness> {
    const business = await this.repo.findByUuid(uuid);
    if (!business) {
      const error = new Error('Tenant business not found');
      (error as any).status = 404;
      throw error;
    }
    return business;
  }

  async createBusiness(data: CreateTenantBusinessDTO): Promise<TenantBusiness> {
    if (!data.name || !data.address || !data.email || !data.phone || !data.type) {
      const error = new Error('name, address, email, phone, and type are required');
      (error as any).status = 400;
      throw error;
    }
    if (!['operator', 'distributor'].includes(data.type)) {
      const error = new Error("type must be 'operator' or 'distributor'");
      (error as any).status = 400;
      throw error;
    }

    if (await this.repo.findByEmail(data.email)) {
      const error = new Error('Email is already registered');
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

    return this.repo.create({
      name: data.name,
      address: data.address,
      email: data.email,
      phone: String(data.phone),
      type: data.type,
      countryId,
    });
  }

  async updateBusiness(uuid: string, data: UpdateTenantBusinessDTO): Promise<TenantBusiness> {
    const business = await this.getBusinessByUuid(uuid);
    if (business.status === 'deleted') {
      const error = new Error('Cannot update a deleted tenant business');
      (error as any).status = 400;
      throw error;
    }

    if (data.email && data.email !== business.email) {
      if (await this.repo.findByEmail(data.email)) {
        const error = new Error('Email is already registered');
        (error as any).status = 409;
        throw error;
      }
    }
    if (data.type && !['operator', 'distributor'].includes(data.type)) {
      const error = new Error("type must be 'operator' or 'distributor'");
      (error as any).status = 400;
      throw error;
    }

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.phone !== undefined) updatePayload.phone = String(data.phone);
    if (data.type !== undefined) updatePayload.type = data.type;

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

    await this.repo.update(uuid, updatePayload);
    return this.getBusinessByUuid(uuid);
  }

  async deleteBusiness(uuid: string): Promise<void> {
    const business = await this.getBusinessByUuid(uuid);
    if (business.status !== 'active') {
      const error = new Error(`Cannot delete a ${business.status} tenant business`);
      (error as any).status = 400;
      throw error;
    }
    await this.repo.delete(uuid);
  }

  async blockBusiness(uuid: string): Promise<TenantBusiness> {
    const business = await this.getBusinessByUuid(uuid);
    if (business.status === 'deleted') {
      const error = new Error('Cannot block a deleted tenant business');
      (error as any).status = 400;
      throw error;
    }
    if (business.status === 'blocked') {
      const error = new Error('Tenant business is already blocked');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'blocked');
    return this.getBusinessByUuid(uuid);
  }

  async unblockBusiness(uuid: string): Promise<TenantBusiness> {
    const business = await this.getBusinessByUuid(uuid);
    if (business.status === 'deleted') {
      const error = new Error('Cannot unblock a deleted tenant business');
      (error as any).status = 400;
      throw error;
    }
    if (business.status === 'active') {
      const error = new Error('Tenant business is already active');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'active');
    return this.getBusinessByUuid(uuid);
  }

  async suspendBusiness(uuid: string): Promise<TenantBusiness> {
    const business = await this.getBusinessByUuid(uuid);
    if (business.status === 'deleted') {
      const error = new Error('Cannot suspend a deleted tenant business');
      (error as any).status = 400;
      throw error;
    }
    if (business.status === 'suspended') {
      const error = new Error('Tenant business is already suspended');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'suspended');
    return this.getBusinessByUuid(uuid);
  }
}

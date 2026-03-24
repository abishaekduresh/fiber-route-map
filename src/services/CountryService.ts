import { CountryRepository } from '../repositories/CountryRepository.js';
import { Country, CreateCountryDTO, UpdateCountryDTO } from '../models/Country.js';

export class CountryService {
  private repo: CountryRepository;

  constructor(repo: CountryRepository) {
    this.repo = repo;
  }

  async getAllCountries(params: any = {}): Promise<{ countries: Country[]; total: number }> {
    return this.repo.getAll(params);
  }

  async getCountryByUuid(uuid: string): Promise<Country> {
    const country = await this.repo.findByUuid(uuid);
    if (!country) {
      const error = new Error('Country not found');
      (error as any).status = 404;
      throw error;
    }
    return country;
  }

  async createCountry(data: CreateCountryDTO): Promise<Country> {
    if (await this.repo.findByCode(data.code)) {
      const error = new Error(`Country code '${data.code}' already exists`);
      (error as any).status = 409;
      throw error;
    }
    return this.repo.create(data);
  }

  async updateCountry(uuid: string, data: UpdateCountryDTO): Promise<Country> {
    const country = await this.getCountryByUuid(uuid);
    
    if (data.code && data.code !== country.code) {
      if (await this.repo.findByCode(data.code)) {
        const error = new Error(`Country code '${data.code}' already exists`);
        (error as any).status = 409;
        throw error;
      }
    }

    await this.repo.update(uuid, data);
    return this.getCountryByUuid(uuid);
  }

  async deleteCountry(uuid: string): Promise<void> {
    await this.getCountryByUuid(uuid);
    await this.repo.delete(uuid);
  }

  async blockCountry(uuid: string): Promise<Country> {
    const country = await this.getCountryByUuid(uuid);
    if (country.status === 'deleted') {
      const error = new Error('Cannot block a deleted country');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'blocked');
    return this.getCountryByUuid(uuid);
  }

  async unblockCountry(uuid: string): Promise<Country> {
    const country = await this.getCountryByUuid(uuid);
    if (country.status === 'deleted') {
      const error = new Error('Cannot unblock a deleted country');
      (error as any).status = 400;
      throw error;
    }
    await this.repo.updateStatus(uuid, 'active');
    return this.getCountryByUuid(uuid);
  }
}

import { DeviceCategoryRepository } from '../repositories/DeviceCategoryRepository.js';
import { DeviceCategory, CreateDeviceCategoryDTO, UpdateDeviceCategoryDTO } from '../models/DeviceCategory.js';

export class DeviceCategoryService {
  constructor(private repo: DeviceCategoryRepository) {}

  async getAll(params: { page?: number; limit?: number; search?: string; status?: string }) {
    return this.repo.getAll(params);
  }

  async getOne(uuid: string): Promise<DeviceCategory> {
    const cat = await this.repo.findByUuid(uuid);
    if (!cat) { const e: any = new Error('Device category not found'); e.status = 404; throw e; }
    return cat;
  }

  private async generateCode(): Promise<string> {
    const last = await this.repo.getLastCode();
    let next = 1;
    if (last) { const n = parseInt(last.substring(2), 10); if (!isNaN(n)) next = n + 1; }
    return `DC${String(next).padStart(4, '0')}`;
  }

  async create(data: CreateDeviceCategoryDTO): Promise<DeviceCategory> {
    const code = await this.generateCode();
    return this.repo.create({ ...data, code });
  }

  async update(uuid: string, data: UpdateDeviceCategoryDTO): Promise<DeviceCategory> {
    await this.getOne(uuid);
    await this.repo.update(uuid, data);
    return this.getOne(uuid);
  }

  async delete(uuid: string): Promise<void> {
    await this.getOne(uuid);
    await this.repo.delete(uuid);
  }
}

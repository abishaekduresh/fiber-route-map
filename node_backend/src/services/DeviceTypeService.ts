import { DeviceTypeRepository } from '../repositories/DeviceTypeRepository.js';
import { DeviceType, CreateDeviceTypeDTO, UpdateDeviceTypeDTO } from '../models/DeviceType.js';

export class DeviceTypeService {
  constructor(private repo: DeviceTypeRepository) {}

  async getAll(params: { page?: number; limit?: number; search?: string; status?: string; categoryId?: number | string }) {
    return this.repo.getAll(params);
  }

  async getOne(uuid: string): Promise<DeviceType> {
    const dt = await this.repo.findByUuid(uuid);
    if (!dt) { const e: any = new Error('Device type not found'); e.status = 404; throw e; }
    return dt;
  }

  private async generateCode(): Promise<string> {
    const last = await this.repo.getLastCode();
    let next = 1;
    if (last) { const n = parseInt(last.substring(2), 10); if (!isNaN(n)) next = n + 1; }
    return `DT${String(next).padStart(4, '0')}`;
  }

  async create(data: CreateDeviceTypeDTO): Promise<DeviceType> {
    const code = await this.generateCode();
    return this.repo.create({ ...data, code });
  }

  async update(uuid: string, data: UpdateDeviceTypeDTO): Promise<DeviceType> {
    await this.getOne(uuid);
    await this.repo.update(uuid, data);
    return this.getOne(uuid);
  }

  async delete(uuid: string): Promise<void> {
    await this.getOne(uuid);
    await this.repo.delete(uuid);
  }
}

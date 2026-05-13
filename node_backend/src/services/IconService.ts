import { IconRepository } from '../repositories/IconRepository.js';
import { CreateIconDTO, UpdateIconDTO, Icon } from '../models/Icon.js';

export class IconService {
  constructor(private repo: IconRepository) {}

  async getAll(params: { page?: number; limit?: number; search?: string; status?: string; type?: string }) {
    return this.repo.getAll(params);
  }

  async getOne(uuid: string): Promise<Icon> {
    const icon = await this.repo.findByUuid(uuid);
    if (!icon) {
      const err: any = new Error('Icon not found');
      err.status = 404;
      throw err;
    }
    return icon;
  }

  private async generateCode(): Promise<string> {
    const lastCode = await this.repo.getLastCode();
    let nextNum = 1;
    if (lastCode) {
      const n = parseInt(lastCode.substring(3), 10); // strip 'ICO'
      if (!isNaN(n)) nextNum = n + 1;
    }
    return `ICO${String(nextNum).padStart(4, '0')}`;
  }

  async create(data: CreateIconDTO): Promise<Icon> {
    const code = await this.generateCode();
    return this.repo.create({ ...data, code });
  }

  async update(uuid: string, data: UpdateIconDTO): Promise<Icon> {
    await this.getOne(uuid);
    await this.repo.update(uuid, data);
    return this.getOne(uuid);
  }

  async delete(uuid: string): Promise<void> {
    await this.getOne(uuid);
    await this.repo.delete(uuid);
  }
}

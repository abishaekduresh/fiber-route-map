import { generateUuidV7 } from '../utils/uuid.js';
import { RoutePointTemplateRepository } from '../repositories/RoutePointTemplateRepository.js';
import type { RoutePointTemplate, CreateRoutePointTemplateDTO, UpdateRoutePointTemplateDTO } from '../models/RoutePointTemplate.js';

export class RoutePointTemplateService {
  constructor(private repo: RoutePointTemplateRepository) {}

  async getAll(params: { page?: number; limit?: number; search?: string; status?: string }) {
    return this.repo.getAll(params);
  }

  async getOne(uuid: string): Promise<RoutePointTemplate> {
    const tpl = await this.repo.findByUuid(uuid);
    if (!tpl) {
      const err: any = new Error('Route point template not found');
      err.status = 404;
      throw err;
    }
    return tpl;
  }

  private async generateCode(): Promise<string> {
    const lastCode = await this.repo.getLastCode();
    let nextNum = 1;
    if (lastCode) {
      const n = parseInt(lastCode.substring(3), 10);
      if (!isNaN(n)) nextNum = n + 1;
    }
    return `RPT${String(nextNum).padStart(4, '0')}`;
  }

  async create(data: CreateRoutePointTemplateDTO): Promise<RoutePointTemplate> {
    const code = await this.generateCode();
    const uuid = generateUuidV7();
    return this.repo.create({ ...data, code, uuid });
  }

  async update(uuid: string, data: UpdateRoutePointTemplateDTO): Promise<RoutePointTemplate> {
    await this.getOne(uuid);
    await this.repo.update(uuid, data);
    return this.getOne(uuid);
  }

  async delete(uuid: string): Promise<void> {
    await this.getOne(uuid);
    await this.repo.delete(uuid);
  }
}

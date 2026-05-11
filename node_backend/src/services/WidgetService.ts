import { WidgetRepository } from '../repositories/WidgetRepository.js';
import { CreateWidgetDTO, UpdateWidgetDTO, Widget } from '../models/Widget.js';

export class WidgetService {
  constructor(private repo: WidgetRepository) {}

  async getAll(params: { page?: number; limit?: number; search?: string; status?: string; type?: string }) {
    return this.repo.getAll(params);
  }

  async getOne(uuid: string): Promise<Widget> {
    const widget = await this.repo.findByUuid(uuid);
    if (!widget) {
      const err: any = new Error('Widget not found');
      err.status = 404;
      throw err;
    }
    return widget;
  }

  private async generateCode(): Promise<string> {
    const lastCode = await this.repo.getLastCode();
    let nextNum = 1;
    if (lastCode) {
      const n = parseInt(lastCode.substring(4), 10); // strip 'WID-'
      if (!isNaN(n)) nextNum = n + 1;
    }
    return `WID-${String(nextNum).padStart(4, '0')}`;
  }

  async create(data: CreateWidgetDTO): Promise<Widget> {
    const code = await this.generateCode();
    return this.repo.create({ ...data, code });
  }

  async update(uuid: string, data: UpdateWidgetDTO): Promise<Widget> {
    await this.getOne(uuid);
    await this.repo.update(uuid, data);
    return this.getOne(uuid);
  }

  async delete(uuid: string): Promise<void> {
    await this.getOne(uuid);
    await this.repo.delete(uuid);
  }
}

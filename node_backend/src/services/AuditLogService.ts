import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { AuditLog, CreateAuditLogDTO } from '../models/AuditLog.js';

export class AuditLogService {
  private repo: AuditLogRepository;

  constructor(repo: AuditLogRepository) {
    this.repo = repo;
  }

  async log(data: CreateAuditLogDTO): Promise<void> {
    await this.repo.create(data);
  }

  async getAllLogs(params: any = {}): Promise<{ logs: AuditLog[]; total: number }> {
    return this.repo.getAll(params);
  }

  async getLogByUuid(uuid: string): Promise<AuditLog> {
    const log = await this.repo.findByUuid(uuid);
    if (!log) {
      const error = new Error('Audit log entry not found');
      (error as any).status = 404;
      throw error;
    }
    return log;
  }
}

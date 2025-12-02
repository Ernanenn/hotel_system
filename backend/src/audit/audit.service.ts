import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: AuditAction,
    userId: string | null,
    entityType?: string,
    entityId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    description?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action,
      userId,
      entityType,
      entityId,
      oldValues,
      newValues,
      description,
      ipAddress,
      userAgent,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}


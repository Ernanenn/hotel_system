import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../entities/audit-log.entity';

export const AUDIT_METADATA_KEY = 'audit';

export interface AuditMetadata {
  action: AuditAction;
  entityType?: string;
  description?: string;
}

export const Audit = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_METADATA_KEY, metadata);


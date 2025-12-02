import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const metadata = this.reflector.get<AuditMetadata>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const userId = (request as any).user?.userId || null;
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Captura valores antigos antes da execução (para UPDATE/DELETE)
    const oldValues = request.body || {};

    return next.handle().pipe(
      tap(async (data) => {
        try {
          const entityId = data?.id || request.params?.id || null;
          const newValues = data || request.body || {};

          await this.auditService.log(
            metadata.action,
            userId,
            metadata.entityType,
            entityId,
            oldValues,
            newValues,
            metadata.description,
            ipAddress as string,
            userAgent,
          );
        } catch (error) {
          // Não falhar a requisição se o audit falhar
          console.error('Audit logging failed:', error);
        }
      }),
    );
  }
}


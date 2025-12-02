import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

/**
 * Guard que verifica se o hotelId está presente no request
 * Use este guard em rotas que requerem um tenant
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const hotelId = request.hotelId;

    if (!hotelId) {
      throw new BadRequestException(
        'Hotel ID não encontrado. Forneça via header X-Hotel-Id ou subdomain.',
      );
    }

    return true;
  }
}


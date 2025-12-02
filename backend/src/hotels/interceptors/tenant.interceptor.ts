import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { HotelsService } from '../hotels.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private hotelsService: HotelsService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const host = request.headers.host || '';
    const subdomain = this.extractSubdomain(host);

    // Tentar obter hotelId do header primeiro
    let hotelId = request.headers['x-hotel-id'];

    // Se não tiver no header, tentar pelo subdomain
    if (!hotelId && subdomain) {
      try {
        const hotel = await this.hotelsService.findBySubdomain(subdomain);
        if (hotel) {
          hotelId = hotel.id;
        }
      } catch (error) {
        // Se não encontrar pelo subdomain, continua sem hotelId
        // (permite acesso sem tenant para admin ou quando não há subdomain)
        // Não lança erro para não bloquear requisições
      }
    }

    // Adicionar hotelId ao request para uso posterior
    request.hotelId = hotelId;

    return next.handle();
  }

  private extractSubdomain(host: string): string | null {
    // Remove porta se existir
    const hostname = host.split(':')[0];

    // Se for localhost ou IP, não tem subdomain
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }

    // Extrai subdomain (ex: hotel1.example.com -> hotel1)
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }
}


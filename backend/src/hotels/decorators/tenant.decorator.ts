import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o hotelId do request
 * Pode ser usado em controllers para obter o hotelId automaticamente
 */
export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.hotelId;
  },
);


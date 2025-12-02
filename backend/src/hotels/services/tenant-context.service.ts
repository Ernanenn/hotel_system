import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * Serviço para gerenciar o contexto do tenant (hotel) atual
 * Usa REQUEST scope para ter acesso ao request atual
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private request: Request) {}

  /**
   * Obtém o hotelId do request atual
   * Pode vir do header X-Hotel-Id ou do subdomain
   */
  getHotelId(): string | null {
    return (this.request as any).hotelId || null;
  }

  /**
   * Verifica se há um hotelId no contexto
   */
  hasHotelId(): boolean {
    return !!this.getHotelId();
  }

  /**
   * Aplica filtro de hotel em uma query builder
   * Retorna a query builder modificada
   */
  applyHotelFilter<T>(queryBuilder: any, hotelIdColumn: string = 'hotelId'): any {
    const hotelId = this.getHotelId();
    if (hotelId) {
      queryBuilder.andWhere(`${queryBuilder.alias}.${hotelIdColumn} = :hotelId`, {
        hotelId,
      });
    }
    return queryBuilder;
  }

  /**
   * Aplica filtro de hotel em um objeto de where
   */
  applyHotelWhere(where: any, hotelIdColumn: string = 'hotelId'): any {
    const hotelId = this.getHotelId();
    if (hotelId) {
      return { ...where, [hotelIdColumn]: hotelId };
    }
    return where;
  }
}


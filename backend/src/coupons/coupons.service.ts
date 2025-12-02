import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Coupon, CouponType } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponsRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    // Verificar se o código já existe
    const existingCoupon = await this.couponsRepository.findOne({
      where: { code: createCouponDto.code },
    });

    if (existingCoupon) {
      throw new BadRequestException('Código de cupom já existe');
    }

    // Validar datas
    const validFrom = new Date(createCouponDto.validFrom);
    const validUntil = new Date(createCouponDto.validUntil);

    if (validUntil <= validFrom) {
      throw new BadRequestException(
        'Data de término deve ser posterior à data de início',
      );
    }

    // Validar valor
    if (createCouponDto.type === CouponType.PERCENTAGE) {
      if (createCouponDto.value < 0 || createCouponDto.value > 100) {
        throw new BadRequestException(
          'Valor percentual deve estar entre 0 e 100',
        );
      }
    } else {
      if (createCouponDto.value <= 0) {
        throw new BadRequestException('Valor fixo deve ser maior que zero');
      }
    }

    const coupon = this.couponsRepository.create({
      ...createCouponDto,
      validFrom,
      validUntil,
      currentUses: 0,
    });

    return this.couponsRepository.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }
    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }
    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    // Validar código único se estiver sendo alterado
    if (updateCouponDto.code && updateCouponDto.code !== coupon.code) {
      const existingCoupon = await this.couponsRepository.findOne({
        where: { code: updateCouponDto.code },
      });

      if (existingCoupon) {
        throw new BadRequestException('Código de cupom já existe');
      }
    }

    // Validar datas se estiverem sendo alteradas
    if (updateCouponDto.validFrom || updateCouponDto.validUntil) {
      const validFrom = updateCouponDto.validFrom
        ? new Date(updateCouponDto.validFrom)
        : coupon.validFrom;
      const validUntil = updateCouponDto.validUntil
        ? new Date(updateCouponDto.validUntil)
        : coupon.validUntil;

      if (validUntil <= validFrom) {
        throw new BadRequestException(
          'Data de término deve ser posterior à data de início',
        );
      }
    }

    Object.assign(coupon, updateCouponDto);
    if (updateCouponDto.validFrom) {
      coupon.validFrom = new Date(updateCouponDto.validFrom);
    }
    if (updateCouponDto.validUntil) {
      coupon.validUntil = new Date(updateCouponDto.validUntil);
    }

    return this.couponsRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponsRepository.remove(coupon);
  }

  async validateCoupon(dto: ValidateCouponDto): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discount?: number;
    finalAmount?: number;
    error?: string;
  }> {
    try {
      const coupon = await this.findByCode(dto.code);

      // Verificar se está ativo
      if (!coupon.isActive) {
        return {
          valid: false,
          error: 'Cupom não está ativo',
        };
      }

      // Verificar validade
      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = new Date(coupon.validUntil);
      validUntil.setHours(23, 59, 59, 999); // Fim do dia

      if (now < validFrom) {
        return {
          valid: false,
          error: 'Cupom ainda não está válido',
        };
      }

      if (now > validUntil) {
        return {
          valid: false,
          error: 'Cupom expirado',
        };
      }

      // Verificar limite de usos
      if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
        return {
          valid: false,
          error: 'Cupom atingiu o limite de usos',
        };
      }

      // Verificar valor mínimo de compra
      if (
        coupon.minPurchaseAmount &&
        dto.totalAmount < Number(coupon.minPurchaseAmount)
      ) {
        return {
          valid: false,
          error: `Valor mínimo de compra: ${coupon.minPurchaseAmount.toFixed(2)}`,
        };
      }

      // Calcular desconto
      let discount = 0;
      if (coupon.type === CouponType.PERCENTAGE) {
        discount = (dto.totalAmount * Number(coupon.value)) / 100;
      } else {
        discount = Number(coupon.value);
        // Garantir que o desconto não seja maior que o valor total
        if (discount > dto.totalAmount) {
          discount = dto.totalAmount;
        }
      }

      const finalAmount = dto.totalAmount - discount;

      return {
        valid: true,
        coupon,
        discount,
        finalAmount,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          valid: false,
          error: 'Cupom não encontrado',
        };
      }
      throw error;
    }
  }

  async applyCoupon(couponId: string): Promise<void> {
    const coupon = await this.findOne(couponId);
    coupon.currentUses += 1;
    await this.couponsRepository.save(coupon);
  }
}


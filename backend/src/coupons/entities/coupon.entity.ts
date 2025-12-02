import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE,
  })
  type: CouponType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number; // Percentual (0-100) ou valor fixo em R$

  @Column({ type: 'date' })
  validFrom: Date;

  @Column({ type: 'date' })
  validUntil: Date;

  @Column({ default: 0 })
  maxUses: number; // 0 = ilimitado

  @Column({ default: 0 })
  currentUses: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minPurchaseAmount: number; // Valor mínimo de compra para usar o cupom

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('reservations')
@Index(['userId'])
@Index(['roomId'])
@Index(['hotelId'])
@Index(['status'])
@Index(['checkIn'])
@Index(['checkOut'])
@Index(['hotelId', 'status'])
@Index(['roomId', 'checkIn', 'checkOut'])
@Index(['userId', 'status'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.reservations)
  @JoinColumn({ name: 'hotelId' })
  hotel: Hotel;

  @Column()
  hotelId: string;

  @ManyToOne(() => Room, (room) => room.reservations)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  roomId: string;

  @Column({ type: 'date' })
  checkIn: Date;

  @Column({ type: 'date' })
  checkOut: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ nullable: true })
  guestNotes: string;

  @Column({ nullable: true })
  couponCode: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  discountAmount: number;

  @Column({ nullable: true, unique: false })
  qrCodeToken: string; // Token único para validação do QR code

  @Column({ nullable: true })
  checkedInAt: Date; // Data/hora do check-in

  @Column({ nullable: true })
  checkedOutAt: Date; // Data/hora do check-out

  @OneToOne(() => Payment, (payment) => payment.reservation)
  payment: Payment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


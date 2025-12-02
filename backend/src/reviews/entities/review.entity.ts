import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';

@Entity('reviews')
@Index(['roomId', 'userId'], { unique: true }) // Um usuário pode avaliar um quarto apenas uma vez
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Room, (room) => room.reviews)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  roomId: string;

  @ManyToOne(() => Reservation, { nullable: true })
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;

  @Column({ nullable: true })
  reservationId: string;

  @Column({ type: 'int' })
  rating: number; // 1-5 estrelas

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: false })
  isVerified: boolean; // Se a avaliação é de uma reserva confirmada

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


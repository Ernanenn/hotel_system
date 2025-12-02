import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';

export enum RoomType {
  SINGLE = 'single',
  DOUBLE = 'double',
  SUITE = 'suite',
  DELUXE = 'deluxe',
}

@Entity('rooms')
@Index(['hotelId'])
@Index(['type'])
@Index(['isAvailable'])
@Index(['pricePerNight'])
@Index(['hotelId', 'isAvailable'])
@Index(['hotelId', 'type'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.rooms)
  @JoinColumn({ name: 'hotelId' })
  hotel: Hotel;

  @Column()
  hotelId: string;

  @Column()
  number: string; // Número do quarto (único por hotel, não globalmente)

  @Column({
    type: 'enum',
    enum: RoomType,
  })
  type: RoomType;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerNight: number;

  @Column('text', { nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  amenities: string[];

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: 1 })
  maxOccupancy: number;

  @Column('text', { nullable: true })
  imageUrl: string;

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];

  @OneToMany(() => Review, (review) => review.room)
  reviews: Review[];

  @Column('decimal', { precision: 3, scale: 2, nullable: true, default: 0 })
  ratingAverage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


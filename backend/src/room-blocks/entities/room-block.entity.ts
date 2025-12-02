import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';

export enum BlockType {
  MAINTENANCE = 'maintenance',
  EVENT = 'event',
  OTHER = 'other',
}

@Entity('room_blocks')
export class RoomBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.id)
  @JoinColumn({ name: 'hotelId' })
  hotel: Hotel;

  @Column()
  hotelId: string;

  @ManyToOne(() => Room, (room) => room.id)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  roomId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: BlockType,
    default: BlockType.MAINTENANCE,
  })
  type: BlockType;

  @Column('text', { nullable: true })
  reason: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


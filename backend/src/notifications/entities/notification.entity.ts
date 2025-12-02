import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationType {
  RESERVATION_CREATED = 'reservation_created',
  RESERVATION_CONFIRMED = 'reservation_confirmed',
  RESERVATION_CANCELLED = 'reservation_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  EMAIL_SENT = 'email_sent',
  CHECKIN_REMINDER = 'checkin_reminder',
  CHECKOUT_REMINDER = 'checkout_reminder',
  CHECKIN_CONFIRMED = 'checkin_confirmed',
  CHECKOUT_CONFIRMED = 'checkout_confirmed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  recipientEmail: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  relatedEntityId: string;

  @CreateDateColumn()
  createdAt: Date;
}


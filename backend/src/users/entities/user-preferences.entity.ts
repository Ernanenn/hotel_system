import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: true })
  reservationConfirmations: boolean;

  @Column({ default: true })
  reservationReminders: boolean;

  @Column({ default: true })
  promotionalEmails: boolean;

  @Column({ default: true })
  smsNotifications: boolean;

  @Column({ default: true })
  pushNotifications: boolean;

  @Column('text', { nullable: true })
  pushSubscription: string; // JSON string da PushSubscription

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


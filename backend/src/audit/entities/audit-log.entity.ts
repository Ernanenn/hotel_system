import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PAYMENT = 'payment',
  RESERVATION = 'reservation',
  ADMIN_ACTION = 'admin_action',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  action: AuditAction;

  @Column({ nullable: true })
  entityType: string; // 'user', 'room', 'reservation', etc.

  @Column({ nullable: true })
  entityId: string;

  @Column('jsonb', { nullable: true })
  oldValues: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newValues: Record<string, any>;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}


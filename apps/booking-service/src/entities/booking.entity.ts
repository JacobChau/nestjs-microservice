import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bookings')
export class BookingEntity {
  @PrimaryGeneratedColumn()
  dbId: number;

  @Column({ unique: true })
  id: string;

  @Column()
  userId: string;

  @Column()
  eventId: string;

  @Column('text', { array: true })
  seatIds: string[];

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'pending'
  })
  status: string;

  @Column({ nullable: true })
  paymentId?: string;

  @Column({ nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 
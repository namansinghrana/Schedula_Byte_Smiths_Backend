import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AvailabilitySession } from './availability.entity';
import { Appointment } from '../appointment/appointment.entity';

export type SlotMode = 'stream' | 'wave';

@Entity('availability_slots')
export class AvailabilitySlot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AvailabilitySession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: AvailabilitySession;

  @Column()
  session_id: number;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ nullable: false })
  maxBookings: number;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Appointment, (appointment) => appointment.slot)
  appointments: Appointment[];
}

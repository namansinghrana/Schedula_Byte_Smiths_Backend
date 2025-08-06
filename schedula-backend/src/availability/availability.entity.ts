import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { SlotMode } from './slot.entity';

@Entity('availability_sessions')
export class AvailabilitySession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', nullable: true })
  date?: string;

  @Column({ nullable: true })
  weekday?: string; // e.g. 'Monday', 'Tuesday'

  @Column()
  session: string; // e.g., Morning, Evening

  @Column({ type: 'time' })
  consulting_start_time: string;

  @Column({ type: 'time' })
  consulting_end_time: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'enum', enum: ['stream', 'wave'] })
  mode: SlotMode;

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilitySlots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column()
  doctor_id: number;
}

export { AvailabilitySession as AvailabilitySlot };

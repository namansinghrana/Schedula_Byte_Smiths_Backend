import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity('waitlist_entries')
export class WaitlistEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column()
  doctor_id: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column()
  patient_id: number;

  @Column()
  reason: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: 'pending' })
  status: string; // pending, contacted, rescheduled
}

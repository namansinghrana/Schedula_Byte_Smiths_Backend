import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { AvailabilitySlot } from '../availability/slot.entity';
import { Patient } from '../entities/patient.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column()
  doctor_id: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient; // ✅ Use Patient instead of User

  @Column()
  patient_id: number;

  @ManyToOne(() => AvailabilitySlot)
  @JoinColumn({ name: 'slot_id' })
  slot: AvailabilitySlot;

  @Column()
  slot_id: number;

  @Column()
  reason: string;

  @Column({ default: false })
  is_no_show: boolean;

  @Column({ default: false })
  penalty_applied: boolean;

  @CreateDateColumn()
  created_at: Date;
}

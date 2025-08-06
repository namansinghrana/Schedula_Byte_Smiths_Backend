import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { AvailabilitySlot } from '../availability/availability.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryColumn()
  user_id: number;

  @OneToOne(() => User, { eager: true }) // eagerly load User details if needed
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  specialization: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ type: 'int', nullable: true })
  experience?: number;


  @OneToMany(() => AvailabilitySlot, (slot) => slot.doctor)
  availabilitySlots: AvailabilitySlot[];

  @Column({ type: 'int', default: 10 })
  defaultSlotDuration: number; // in minutes

  @Column({
    type: 'enum',
    enum: ['onTime', 'delayed', 'unavailable'],
    default: 'onTime',
  })
  status: 'onTime' | 'delayed' | 'unavailable';
}

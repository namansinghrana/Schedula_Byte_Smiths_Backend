import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('patients')
export class Patient {
  @PrimaryColumn()
  user_id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date' })
  date_of_birth: Date;

  @Column()
  gender: string;

  @Column()
  contact_number: string;

  @Column()
  address: string;
}

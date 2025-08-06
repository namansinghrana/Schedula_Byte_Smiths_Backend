// appointment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { AvailabilitySlot } from '../availability/slot.entity';
import { AvailabilitySession } from '../availability/availability.entity';
import { WaitlistEntry } from '../entities/waitlist.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AvailabilitySlot,
      AvailabilitySession,
      WaitlistEntry,
      Patient,
      Doctor,
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}

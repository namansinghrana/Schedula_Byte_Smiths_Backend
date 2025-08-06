import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitySession } from './availability.entity';
import { AvailabilitySlot } from './slot.entity';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { Appointment } from 'src/appointment/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AvailabilitySession,
      AvailabilitySlot,
      Appointment,
      // Added Doctor entity for DI
      require('../entities/doctor.entity').Doctor,
    ]),
  ],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
})
export class AvailabilityModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';
import { ElasticSchedulingService } from './elasticScheduling.service';
import { ElasticSchedulingController } from './elastic-scheduling.controller';
import { AvailabilitySlot } from '../availability/slot.entity';
import { AvailabilitySession } from '../availability/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Doctor, Patient, AvailabilitySlot, AvailabilitySession]),
  ],
  providers: [ElasticSchedulingService],
  controllers: [ElasticSchedulingController],
})
export class ElasticSchedulingModule {}

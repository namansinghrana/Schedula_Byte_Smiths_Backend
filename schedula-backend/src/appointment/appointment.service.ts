// ...existing code...

// ...existing code...
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AvailabilitySlot } from '../availability/slot.entity';
import { WaitlistEntry } from '../entities/waitlist.entity';
import { Patient } from '../entities/patient.entity';
import { Doctor } from '../entities/doctor.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(AvailabilitySlot)
    private slotRepo: Repository<AvailabilitySlot>,

    @InjectRepository(WaitlistEntry)
    private waitlistRepo: Repository<WaitlistEntry>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const slot = await this.slotRepo.findOne({
      where: { id: dto.slotId },
      relations: ['appointments'],
    });

    if (!slot) throw new NotFoundException('Slot not found');

    const existingAppointments = slot.appointments
      ? slot.appointments.length
      : 0;
    const maxBookings = slot.maxBookings || 1;

    const patient = await this.patientRepo.findOneBy({
      user_id: dto.patientId,
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const doctor = await this.doctorRepo.findOneBy({ user_id: dto.doctorId });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (existingAppointments < maxBookings) {
      const appointment = this.appointmentRepo.create({
        slot_id: slot.id,
        patient_id: patient.user_id,
        doctor_id: doctor.user_id,
        reason: dto.reason,
      });
      return this.appointmentRepo.save(appointment);
    } else {
      // Add to waitlist if not already added
      const alreadyInWaitlist = await this.waitlistRepo.findOne({
        where: {
          patient: { user_id: dto.patientId },
          doctor: { user_id: dto.doctorId },
        },
        relations: ['patient', 'doctor'],
      });

      if (alreadyInWaitlist) {
        return { message: 'Already in waitlist' };
      }

      const waitlistEntry = this.waitlistRepo.create({
        patient_id: patient.user_id,
        doctor_id: doctor.user_id,
        reason: dto.reason,
      });

      await this.waitlistRepo.save(waitlistEntry);
      return { message: 'Added to waitlist' };
    }
  }

  // Method expected by controller
  async createAppointment(patientId: number, dto: CreateAppointmentDto) {
    // Use the patientId from the request (authenticated user)
    const createDto = { ...dto, patientId };
    return this.create(createDto);
  }

  // Method expected by controller
  async rescheduleAppointment(
    appointmentId: number,
    userId: number,
    role: string,
    dto: any,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check if user has permission to reschedule
    if (role === 'patient' && appointment.patient_id !== userId) {
      throw new NotFoundException('Appointment not found');
    }
    if (role === 'doctor' && appointment.doctor_id !== userId) {
      throw new NotFoundException('Appointment not found');
    }

    // Update appointment with new slot
    appointment.slot_id = dto.newSlotId;
    return this.appointmentRepo.save(appointment);
  }

  // Method expected by controller
  async cancel(appointmentId: number) {
    const appointment = await this.appointmentRepo.findOneBy({
      id: appointmentId,
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    await this.appointmentRepo.remove(appointment);
    return { message: 'Appointment cancelled successfully' };
  }

  // Method expected by controller
  async getForPatient(patientId: number) {
    return this.appointmentRepo.find({
      where: { patient_id: patientId },
      relations: ['slot', 'doctor', 'doctor.user'],
    });
  }

  // Method expected by controller
  async getForDoctor(doctorId: number) {
    return this.appointmentRepo.find({
      where: { doctor_id: doctorId },
      relations: ['slot', 'patient', 'patient.user'],
    });
  }

  async markNoShowAndReallocate(appointmentId: number) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['slot', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Mark as no-show and optionally apply penalty
    appointment.is_no_show = true;
    appointment.penalty_applied = true; // Optional logic to control this
    await this.appointmentRepo.save(appointment);

    // Reallocate to a patient from waitlist
    const waitlisted = await this.waitlistRepo.findOne({
      where: {
        doctor_id: appointment.doctor_id,
        status: 'pending',
      },
      order: { created_at: 'ASC' },
    });

    if (!waitlisted) {
      console.log(
        'No waitlisted patient found. Slot remains free or can be offered to walk-in.',
      );
      return {
        message: 'Marked as no-show. No waitlisted patients to reassign.',
      };
    }

    // Reassign the appointment to the waitlisted patient
    const reassignedAppointment = this.appointmentRepo.create({
      doctor_id: appointment.doctor_id,
      patient_id: waitlisted.patient_id,
      slot_id: appointment.slot_id,
      reason: waitlisted.reason,
    });
    await this.appointmentRepo.save(reassignedAppointment);

    // Update waitlist status
    waitlisted.status = 'rescheduled';
    await this.waitlistRepo.save(waitlisted);

    // Optionally notify new patient
    console.log(
      `✅ Slot reassigned to patient ${waitlisted.patient_id} from waitlist`,
    );

    return {
      message: 'Marked as no-show and slot reassigned from waitlist',
      reassignedTo: waitlisted.patient_id,
    };
  }

  // Cancels an appointment mid-session (basic version: same as cancel)
  async cancelMidSession(appointmentId: number) {
    const appointment = await this.appointmentRepo.findOneBy({ id: appointmentId });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    await this.appointmentRepo.remove(appointment);
    return { message: 'Appointment cancelled mid-session successfully' };
  }
}

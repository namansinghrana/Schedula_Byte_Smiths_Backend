import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { AvailabilitySlot } from '../availability/slot.entity';
import { AvailabilitySession } from '../availability/availability.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { UpdateDoctorStatusDto } from './dto/update-doctor-status.dto';
import { DoctorStatus } from './dto/../enums/doctor-status.enum';
import * as moment from 'moment';

@Injectable()
export class ElasticSchedulingService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
    @InjectRepository(AvailabilitySlot)
    private slotRepo: Repository<AvailabilitySlot>,
    @InjectRepository(AvailabilitySession)
    private sessionRepo: Repository<AvailabilitySession>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  async updateDoctorStatus(doctorId: number, dto: UpdateDoctorStatusDto) {
    const doctor = await this.doctorRepo.findOneBy({ user_id: doctorId });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Update doctor status
    doctor.status = dto.status;

    // Optional: Save delayMinutes to doctor entity if applicable
    if (dto.status === DoctorStatus.DELAYED) {
      if (dto.delayMinutes == null) {
        throw new BadRequestException(
          'delayMinutes is required when status is delayed',
        );
      }
      await this.shiftAppointments(doctorId, dto.delayMinutes);
    }

    // NEW: Handle unavailable status
    if (dto.status === DoctorStatus.UNAVAILABLE) {
      await this.handleDoctorUnavailable(doctorId);
    }

    await this.doctorRepo.save(doctor);

    return { message: 'Doctor status updated successfully' };
  }

  async shiftAppointments(doctorId: number, delayMinutes: number) {
    const now = (moment() as moment.Moment).format('HH:mm');

    const slots = await this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.session', 'session')
      .where('slot.is_active = :active', { active: true })
      .andWhere('session.doctor_id = :doctorId', { doctorId })
      .andWhere('slot.startTime > :now', { now })
      .getMany();

    const updatedSlots = await Promise.all(
      slots.map(async (slot) => {
        if (
          typeof slot.startTime === 'string' &&
          typeof slot.endTime === 'string'
        ) {
          const startMoment = moment(slot.startTime, 'HH:mm');
          const endMoment = moment(slot.endTime, 'HH:mm');

          if (startMoment.isValid() && endMoment.isValid()) {
            slot.startTime = startMoment
              .add(delayMinutes, 'minutes')
              .format('HH:mm');
            slot.endTime = endMoment
              .add(delayMinutes, 'minutes')
              .format('HH:mm');
          }
        }

        return this.slotRepo.save(slot);
      }),
    );

    const updatedSlotIds = updatedSlots.map((s) => s.id);

    const appointments = await this.appointmentRepo.find({
      where: {
        slot_id: MoreThan(0),
      },
      relations: ['slot'],
    });

    appointments
      .filter((appt) => updatedSlotIds.includes(appt.slot_id))
      .forEach((appt) => {
        console.log(
          `📢 Notify patient ${appt.patient_id}: Your appointment has been delayed by ${delayMinutes} minutes.`,
        );
      });

    return appointments;
  }

  // NEW METHOD: Handle doctor unavailable scenario
  async handleDoctorUnavailable(doctorId: number) {
    console.log(`🚨 Doctor ${doctorId} marked as unavailable. Starting bulk reschedule...`);

    // 1. Get all active slots for this doctor
    const activeSlots = await this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.session', 'session')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .where('slot.is_active = :active', { active: true })
      .andWhere('session.doctor_id = :doctorId', { doctorId })
      .getMany();

    if (activeSlots.length === 0) {
      console.log('✅ No active slots found for this doctor.');
      return {
        message: 'Doctor marked unavailable, no active slots to reschedule',
        rescheduledCount: 0
      };
    }

    // 2. Get all appointments for these slots
    const appointments = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('appointment.slot', 'slot')
      .where('appointment.slot_id IN (:...slotIds)', { 
        slotIds: activeSlots.map(slot => slot.id) 
      })
      .getMany();

    console.log(`📋 Found ${appointments.length} appointments to reschedule`);

    // 3. Find alternative slots and reschedule appointments
    const rescheduledAppointments = await this.bulkRescheduleAppointments(
      appointments, 
      activeSlots[0]?.session?.doctor?.specialization
    );

    // 4. Deactivate original slots
    await this.deactivateSlots(activeSlots);

    // 5. Notify all affected patients
    await this.notifyPatientsOfReschedule(rescheduledAppointments);

    console.log(`✅ Bulk reschedule completed. ${rescheduledAppointments.length} appointments rescheduled.`);

    return {
      message: 'Doctor marked unavailable, appointments rescheduled',
      rescheduledCount: rescheduledAppointments.length,
      totalAppointments: appointments.length
    };
  }

  // NEW METHOD: Bulk reschedule appointments
  async bulkRescheduleAppointments(appointments: Appointment[], doctorSpecialization?: string) {
    const rescheduledAppointments: Array<{
      appointmentId: number;
      patientId: number;
      originalSlot: AvailabilitySlot;
      newSlot: AvailabilitySlot;
      patientEmail: string;
      patientName: string;
      doctorSpecialization?: string;
    }> = [];

    for (const appointment of appointments) {
      try {
        // Find alternative slot
        const alternativeSlot = await this.findAlternativeSlot(
          appointment.doctor_id,
          doctorSpecialization
        );

        if (alternativeSlot) {
          // Update appointment with new slot
          const originalSlot = appointment.slot;
          appointment.slot_id = alternativeSlot.id;
          await this.appointmentRepo.save(appointment);
          
          rescheduledAppointments.push({
            appointmentId: appointment.id,
            patientId: appointment.patient_id,
            originalSlot: originalSlot,
            newSlot: alternativeSlot,
            patientEmail: appointment.patient.user.email,
            patientName: appointment.patient.user.name,
            doctorSpecialization: doctorSpecialization
          });

          console.log(`✅ Rescheduled appointment ${appointment.id} for patient ${appointment.patient.user.name}`);
        } else {
          // No alternative found - handle gracefully
          await this.handleNoAlternativeFound(appointment);
        }
      } catch (error) {
        console.error(`❌ Error rescheduling appointment ${appointment.id}:`, error.message);
        await this.handleNoAlternativeFound(appointment);
      }
    }

    return rescheduledAppointments;
  }

  // NEW METHOD: Find alternative slot
  async findAlternativeSlot(originalDoctorId: number, specialization?: string) {
    const query = this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.session', 'session')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .leftJoin('appointments', 'appointments', 'appointments.slot_id = slot.id')
      .where('slot.is_active = :active', { active: true })
      .andWhere('session.doctor_id != :originalDoctorId', { originalDoctorId })
      .andWhere('doctor.status = :status', { status: DoctorStatus.ON_TIME })
      .groupBy('slot.id, session.id, doctor.user_id')
      .having('COUNT(appointments.id) < slot.maxBookings OR slot.maxBookings IS NULL');

    if (specialization) {
      query.andWhere('doctor.specialization = :specialization', { specialization });
    }

    // First try to find a slot with the same specialization
    let alternativeSlot = await query.getOne();

    // If no slot found with same specialization, try any available slot
    if (!alternativeSlot && specialization) {
      console.log(`⚠️ No slots found with specialization ${specialization}, trying any available slot...`);
      const generalQuery = this.slotRepo
        .createQueryBuilder('slot')
        .leftJoinAndSelect('slot.session', 'session')
        .leftJoinAndSelect('session.doctor', 'doctor')
        .leftJoin('appointments', 'appointments', 'appointments.slot_id = slot.id')
        .where('slot.is_active = :active', { active: true })
        .andWhere('session.doctor_id != :originalDoctorId', { originalDoctorId })
        .andWhere('doctor.status = :status', { status: DoctorStatus.ON_TIME })
        .groupBy('slot.id, session.id, doctor.user_id')
        .having('COUNT(appointments.id) < slot.maxBookings OR slot.maxBookings IS NULL');

      alternativeSlot = await generalQuery.getOne();
    }

    return alternativeSlot;
  }

  // NEW METHOD: Deactivate slots
  async deactivateSlots(slots: AvailabilitySlot[]) {
    for (const slot of slots) {
      slot.is_active = false;
      await this.slotRepo.save(slot);
      console.log(`🔒 Deactivated slot ${slot.id}`);
    }
  }

  // NEW METHOD: Notify patients
  async notifyPatientsOfReschedule(rescheduledAppointments: any[]) {
    for (const reschedule of rescheduledAppointments) {
      const notification = `
📧 NOTIFICATION TO: ${reschedule.patientEmail}
Dear ${reschedule.patientName},

Your appointment has been rescheduled due to doctor unavailability.

Original Time: ${reschedule.originalSlot?.startTime} - ${reschedule.originalSlot?.endTime}
New Time: ${reschedule.newSlot?.startTime} - ${reschedule.newSlot?.endTime}
${reschedule.doctorSpecialization ? `Specialization: ${reschedule.doctorSpecialization}` : ''}

We apologize for any inconvenience.

Best regards,
Schedula Medical Team
      `;
      
      console.log(notification);
      
      // TODO: Integrate with actual notification service (email/SMS)
      // await this.notificationService.sendEmail({
      //   to: reschedule.patientEmail,
      //   subject: 'Appointment Rescheduled - Doctor Unavailable',
      //   template: 'appointment-reschedule',
      //   data: reschedule
      // });
    }
  }

  // NEW METHOD: Handle cases where no alternative is found
  async handleNoAlternativeFound(appointment: Appointment) {
    const cancellationNotice = `
❌ CANCELLATION NOTICE TO: ${appointment.patient.user.email}
Dear ${appointment.patient.user.name},

Unfortunately, we couldn't find an alternative slot for your appointment due to doctor unavailability.

Your appointment (ID: ${appointment.id}) has been cancelled.
Reason: ${appointment.reason}

Please contact our support team to reschedule at your convenience.

We sincerely apologize for the inconvenience.

Best regards,
Schedula Medical Team
    `;
    
    console.log(cancellationNotice);
    
    // Mark appointment as cancelled (removing it for now, but you might want to add a status field)
    await this.appointmentRepo.remove(appointment);
    
    // TODO: Integrate with actual notification service
    // await this.notificationService.sendEmail({
    //   to: appointment.patient.user.email,
    //   subject: 'Appointment Cancelled - Doctor Unavailable',
    //   template: 'appointment-cancellation',
    //   data: appointment
    // });
  }
}

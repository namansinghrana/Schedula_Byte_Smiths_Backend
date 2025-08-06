import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { AvailabilitySession } from './availability.entity';
import { AvailabilitySlot } from './slot.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
import { Appointment } from '../appointment/appointment.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilitySession)
    private readonly sessionRepo: Repository<AvailabilitySession>,

    @InjectRepository(AvailabilitySlot)
    private readonly slotRepo: Repository<AvailabilitySlot>,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async createSession(doctorId: number, dto: CreateSessionDto) {
    if (!dto.date && !dto.weekday) {
      throw new Error('Either date or weekday must be provided');
    }

    const session = this.sessionRepo.create({
      ...dto,
      doctor_id: doctorId,
      is_active: true,
    });
    return await this.sessionRepo.save(session);
  }

  async getSessionsForDoctor(doctorId: number) {
    return this.sessionRepo.find({
      where: { doctor_id: doctorId, is_active: true },
      relations: [],
    });
  }

  async createSlot(dto: CreateSlotDto) {
    const session = await this.sessionRepo.findOneBy({
      id: dto.session_id,
      is_active: true,
    });
    if (!session) throw new NotFoundException('Session not found');

    // Fetch doctor to get defaultSlotDuration
    const doctor = await this.doctorRepo.findOne({ where: { user_id: session.doctor_id } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // Calculate endTime using defaultSlotDuration
    const [startHour, startMinute] = dto.startTime.split(':').map(Number);
    const duration = doctor.defaultSlotDuration || 10;
    const startDate = new Date(0, 0, 0, startHour, startMinute);
    startDate.setMinutes(startDate.getMinutes() + duration);
    const endHour = String(startDate.getHours()).padStart(2, '0');
    const endMinute = String(startDate.getMinutes()).padStart(2, '0');
    const endTime = `${endHour}:${endMinute}`;

    // Check for overlapping slots
    const overlappingSlot = await this.slotRepo.findOne({
      where: {
        session_id: dto.session_id,
        startTime: dto.startTime,
        endTime: endTime,
        is_active: true,
      },
    });

    if (overlappingSlot) {
      throw new BadRequestException('Overlapping slot exists');
    }

    const slot = this.slotRepo.create({
      session_id: dto.session_id,
      startTime: dto.startTime,
      endTime: endTime,
      maxBookings: dto.maxBookings,
      is_active: true,
    });

    return await this.slotRepo.save(slot);
  }

  async deleteSlot(slotId: number) {
    const slot = await this.slotRepo.findOneBy({ id: slotId });
    if (!slot) throw new NotFoundException('Slot not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { slot_id: slotId },
    });
    if (appointment)
      throw new BadRequestException(
        'Cannot delete slot with existing appointments',
      );

    slot.is_active = false;
    return await this.slotRepo.save(slot);
  }

  async toggleSession(sessionId: number) {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { slot: { session: { id: sessionId } } },
    });
    if (appointment)
      throw new BadRequestException(
        'Cannot toggle session with existing appointments',
      );

    session.is_active = !session.is_active;
    return await this.sessionRepo.save(session);
  }

  async deleteSession(sessionId: number) {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { slot: { session: { id: sessionId } } },
    });
    if (appointment)
      throw new BadRequestException(
        'Cannot delete session with existing appointments',
      );

    session.is_active = false;
    return await this.sessionRepo.save(session);
  }

  /**
   * Expands a stream slot and shifts subsequent appointments forward.
   * Returns warnings if conflicts are detected (end-of-day, breaks, etc).
   */
  async expandSlot(slotId: number, newDuration: number): Promise<{ warnings: string[], affectedAppointments: Appointment[], extensionMinutes: number }> {
    // Find the slot
    const slot = await this.slotRepo.findOne({ where: { id: slotId, is_active: true } });
    if (!slot) throw new NotFoundException('Slot not found');

    // Find session and doctor
    const session = await this.sessionRepo.findOne({ where: { id: slot.session_id, is_active: true } });
    if (!session) throw new NotFoundException('Session not found');
    const doctor = await this.doctorRepo.findOne({ where: { user_id: session.doctor_id } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // Check maximum duration constraint (2x default slot duration)
    const maxDuration = doctor.defaultSlotDuration * 2;
    if (newDuration > maxDuration) {
      throw new BadRequestException(`Cannot expand slot beyond ${maxDuration} minutes (2x default duration)`);
    }

    // Calculate new endTime for the slot
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const startDate = new Date(0, 0, 0, startHour, startMinute);
    startDate.setMinutes(startDate.getMinutes() + newDuration);

    // Common calculations regardless of mode
    const [consultStart, consultEnd] = [
      new Date(0, 0, 0, ...session.consulting_start_time.split(':').map(Number)),
      new Date(0, 0, 0, ...session.consulting_end_time.split(':').map(Number))
    ];

    // Calculate extension amount (in minutes)
    const oldEndDate = new Date(0, 0, 0, ...slot.endTime.split(':').map(Number));
    const oldDuration = (oldEndDate.getHours() * 60 + oldEndDate.getMinutes()) - (startHour * 60 + startMinute);
    const extensionMinutes = newDuration - oldDuration;
    const diffMinutes = extensionMinutes;

    const newEndTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    const warnings: string[] = [];
    const affectedAppointments: Appointment[] = [];

    if (startDate > consultEnd) {
      warnings.push(`Slot expansion would exceed consulting hours (ends at ${session.consulting_end_time})`);
    }

    if (session.mode === 'wave') {
      // For wave mode: only check consulting hours
      // Update slot
      slot.endTime = newEndTime;
      const updatedSlot = await this.slotRepo.save(slot);
      console.log(`Wave mode - Slot ${slot.id} expanded: startTime=${slot.startTime}, endTime=${updatedSlot.endTime}`);

      // Get affected appointments
      const appointments = await this.appointmentRepo.find({ where: { slot_id: slot.id } });
      if (appointments.length > 0) {
        console.log(`Wave mode - ${appointments.length} appointment(s) affected in slot ${slot.id}`);
      }
      affectedAppointments.push(...appointments);

      return { warnings, affectedAppointments, extensionMinutes };
    }

    // Stream mode: Handle subsequent slots
    // Find all subsequent slots in the same session, ordered by startTime
    const subsequentSlots = await this.slotRepo.find({
      where: { session_id: session.id, is_active: true },
      order: { startTime: 'ASC' },
    });
    const slotIndex = subsequentSlots.findIndex(s => s.id === slot.id);
    if (slotIndex === -1) throw new NotFoundException('Slot not found in session');

    let lastEndTime = newEndTime;
    for (let i = slotIndex + 1; i < subsequentSlots.length; i++) {
      const s = subsequentSlots[i];
      // Shift start and end times forward by diffMinutes
      const sStart = new Date(0, 0, 0, ...s.startTime.split(':').map(Number));
      sStart.setMinutes(sStart.getMinutes() + diffMinutes);
      const sEnd = new Date(0, 0, 0, ...s.endTime.split(':').map(Number));
      sEnd.setMinutes(sEnd.getMinutes() + diffMinutes);

      // Check for conflicts with consulting hours
      if (sEnd > consultEnd) {
        warnings.push(`Slot at ${s.startTime} will exceed doctor's working hours.`);
      }
      
      if (sEnd > consultEnd || sStart < consultStart) {
        warnings.push(`Slot expansion would overlap with break/non-consulting hours (${session.consulting_start_time} - ${session.consulting_end_time})`);
      }

      // Update slot times
      s.startTime = `${String(sStart.getHours()).padStart(2, '0')}:${String(sStart.getMinutes()).padStart(2, '0')}`;
      s.endTime = `${String(sEnd.getHours()).padStart(2, '0')}:${String(sEnd.getMinutes()).padStart(2, '0')}`;
      await this.slotRepo.save(s);
      lastEndTime = s.endTime;

      // Find appointments for this slot
      const appointments = await this.appointmentRepo.find({ where: { slot_id: s.id } });
      affectedAppointments.push(...appointments);
    }

    // Update the expanded slot's endTime
    slot.endTime = newEndTime;
    const updatedSlot = await this.slotRepo.save(slot);
    console.log(`Slot ${slot.id} updated: startTime=${slot.startTime}, endTime=${updatedSlot.endTime}`);

    // Find appointments for expanded slot
    const expandedAppointments = await this.appointmentRepo.find({ where: { slot_id: slot.id } });
    affectedAppointments.push(...expandedAppointments);

    // Return warnings, affected appointments, and extension amount for confirmation
    return { warnings, affectedAppointments, extensionMinutes };
  }

  /**
   * Shrinks a stream slot and shifts subsequent appointments earlier.
   * Returns warnings if patients may not be available earlier.
   */
  async shrinkSlot(slotId: number, newDuration: number): Promise<{ warnings: string[], affectedAppointments: Appointment[], shrinkMinutes: number }> {
    // Find the slot
    const slot = await this.slotRepo.findOne({ where: { id: slotId, is_active: true } });
    if (!slot) throw new NotFoundException('Slot not found');

    // Find session and doctor
    const session = await this.sessionRepo.findOne({ where: { id: slot.session_id, is_active: true } });
    if (!session) throw new NotFoundException('Session not found');
    const doctor = await this.doctorRepo.findOne({ where: { user_id: session.doctor_id } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // Calculate new endTime for the slot
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const startDate = new Date(0, 0, 0, startHour, startMinute);
    startDate.setMinutes(startDate.getMinutes() + newDuration);
    const endHour = String(startDate.getHours()).padStart(2, '0');
    const endMinute = String(startDate.getMinutes()).padStart(2, '0');
    const newEndTime = `${endHour}:${endMinute}`;

    // Calculate shrink amount (in minutes)
    const oldEndDate = new Date(0, 0, 0, ...slot.endTime.split(':').map(Number));
    const oldDuration = (oldEndDate.getHours() * 60 + oldEndDate.getMinutes()) - (startHour * 60 + startMinute);
    const shrinkMinutes = oldDuration - newDuration;
    const diffMinutes = shrinkMinutes;
    
    if (diffMinutes <= 0) throw new BadRequestException('New duration must be less than current duration');

    const warnings: string[] = [];
    const affectedAppointments: Appointment[] = [];

    // Handle wave mode differently
    if (session.mode === 'wave') {
      // For wave mode: only check consulting hours
      slot.endTime = newEndTime;
      const updatedSlot = await this.slotRepo.save(slot);
      console.log(`Wave mode - Slot ${slot.id} shrunk: startTime=${slot.startTime}, endTime=${updatedSlot.endTime}`);

      // Get affected appointments
      const appointments = await this.appointmentRepo.find({ where: { slot_id: slot.id } });
      affectedAppointments.push(...appointments);

      // Add warning about patient appointments
      if (appointments.length > 0) {
        console.log(`Wave mode - ${appointments.length} appointment(s) affected in slot ${slot.id}`);
        warnings.push('Patients in this slot may need to be notified about the shorter duration');
      }

      return { warnings, affectedAppointments, shrinkMinutes };
    }

    // Stream mode: Handle subsequent slots
    const subsequentSlots = await this.slotRepo.find({
      where: { session_id: session.id, is_active: true },
      order: { startTime: 'ASC' },
    });
    const slotIndex = subsequentSlots.findIndex(s => s.id === slot.id);
    if (slotIndex === -1) throw new NotFoundException('Slot not found in session');

    // Shift all subsequent slots and appointments earlier
    for (let i = slotIndex + 1; i < subsequentSlots.length; i++) {
      const s = subsequentSlots[i];
      // Shift start and end times earlier by diffMinutes
      const sStart = new Date(0, 0, 0, ...s.startTime.split(':').map(Number));
      sStart.setMinutes(sStart.getMinutes() - diffMinutes);
      const sEnd = new Date(0, 0, 0, ...s.endTime.split(':').map(Number));
      sEnd.setMinutes(sEnd.getMinutes() - diffMinutes);
      // Check for break time conflicts by comparing with consulting hours
      const [consultStart, consultEnd] = [
        new Date(0, 0, 0, ...session.consulting_start_time.split(':').map(Number)),
        new Date(0, 0, 0, ...session.consulting_end_time.split(':').map(Number))
      ];
      
      if (sEnd > consultEnd || sStart < consultStart) {
        warnings.push(`Slot would overlap with break/non-consulting hours (${session.consulting_start_time} - ${session.consulting_end_time})`);
      }

      // Check for patient availability (placeholder: always warn)
      warnings.push(`Patient for slot at ${s.startTime} may not be available at new time ${String(sStart.getHours()).padStart(2, '0')}:${String(sStart.getMinutes()).padStart(2, '0')}`);

      // Update slot times
      s.startTime = `${String(sStart.getHours()).padStart(2, '0')}:${String(sStart.getMinutes()).padStart(2, '0')}`;
      s.endTime = `${String(sEnd.getHours()).padStart(2, '0')}:${String(sEnd.getMinutes()).padStart(2, '0')}`;
      await this.slotRepo.save(s);
      // Find appointments for this slot
      const appointments = await this.appointmentRepo.find({ where: { slot_id: s.id } });
      affectedAppointments.push(...appointments);
    }
    // Update the shrunken slot's endTime
    slot.endTime = newEndTime;
    const updatedSlot = await this.slotRepo.save(slot);
    // Debug log: verify slot update
    console.log(`Slot ${slot.id} shrunk: startTime=${slot.startTime}, endTime=${updatedSlot.endTime}`);
    // Find appointments for shrunken slot
    const shrunkenAppointments = await this.appointmentRepo.find({ where: { slot_id: slot.id } });
    affectedAppointments.push(...shrunkenAppointments);

    // Return warnings, affected appointments, and shrink amount for confirmation
    return { warnings, affectedAppointments, shrinkMinutes };
  }
}

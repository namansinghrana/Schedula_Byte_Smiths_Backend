// dto/reschedule-appointment.dto.ts
import { IsInt } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsInt()
  newSlotId: number;
}

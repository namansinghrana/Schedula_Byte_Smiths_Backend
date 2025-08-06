// dto/create-appointment.dto.ts
import { IsNotEmpty, IsInt, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  doctorId: number;

  @IsInt()
  patientId: number;

  @IsInt()
  slotId: number;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

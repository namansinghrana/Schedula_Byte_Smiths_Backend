// src/doctor/dto/update-doctor.dto.ts
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsNumber()
  experience?: number;

  @IsOptional()
  @IsNumber()
  defaultSlotDuration?: number;
}

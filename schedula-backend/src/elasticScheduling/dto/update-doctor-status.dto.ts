// dto/update-doctor-status.dto.ts
import { IsEnum, ValidateIf, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { DoctorStatus } from '../enums/doctor-status.enum';

export class UpdateDoctorStatusDto {
  @IsEnum(DoctorStatus, {
    message:
      'status must be one of the following values: onTime, delayed, unavailable',
  })
  status: DoctorStatus;

  @ValidateIf((o) => o.status === DoctorStatus.DELAYED)
  @IsNumber()
  @Type(() => Number)
  delayMinutes?: number;
}

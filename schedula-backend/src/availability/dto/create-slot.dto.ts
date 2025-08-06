import { IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateSlotDto {
  @IsNotEmpty()
  session_id: number;

  @IsNotEmpty()
  startTime: string;

  @IsOptional()
  @IsInt()
  maxBookings?: number;
}

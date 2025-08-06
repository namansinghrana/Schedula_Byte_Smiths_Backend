import { IsInt, IsNotEmpty } from 'class-validator';

export class ExpandSlotDto {
  @IsNotEmpty()
  @IsInt()
  slotId: number;

  @IsNotEmpty()
  @IsInt()
  newDuration: number; // in minutes
}

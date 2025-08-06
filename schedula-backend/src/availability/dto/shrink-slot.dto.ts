import { IsInt, IsNotEmpty } from 'class-validator';

export class ShrinkSlotDto {
  @IsNotEmpty()
  @IsInt()
  slotId: number;

  @IsNotEmpty()
  @IsInt()
  newDuration: number; // in minutes
}

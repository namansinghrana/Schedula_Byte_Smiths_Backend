import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  weekday?: string;

  @IsNotEmpty()
  session: string;

  @IsNotEmpty()
  consulting_start_time: string;

  @IsNotEmpty()
  consulting_end_time: string;

  @IsEnum(['stream', 'wave'])
  mode: 'stream' | 'wave';
}

import { IsEmail, IsInt, IsString } from 'class-validator';

export class RegisterDoctorDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  specialization: string;

  @IsString()
  bio: string;

  @IsInt()
  experience: number;
}

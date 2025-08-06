import { IsEmail, IsString, IsDateString } from 'class-validator';

export class RegisterPatientDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsDateString()
  date_of_birth: string;

  @IsString()
  gender: string;

  @IsString()
  contact_number: string;

  @IsString()
  address: string;
}

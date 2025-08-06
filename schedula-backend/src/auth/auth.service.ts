import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from '../entities/user.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    private jwtService: JwtService,
  ) {}

  async registerDoctor(dto: RegisterDoctorDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.DOCTOR,
    });
    const savedUser = await this.usersRepo.save(user);

    const doctor = this.doctorRepo.create({
      user: savedUser,
      specialization: dto.specialization,
      experience: dto.experience,
    });
    await this.doctorRepo.save(doctor);

    return { message: 'Doctor registered successfully' };
  }

  async registerPatient(dto: RegisterPatientDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Step 1: Create and save the User entity
    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.PATIENT,
    });
    const savedUser = await this.usersRepo.save(user);

    // Step 2: Create and save the Patient entity
    const patient = this.patientRepo.create({
      user: savedUser,
      user_id: savedUser.id,
      date_of_birth: dto.date_of_birth,
      gender: dto.gender,
      contact_number: dto.contact_number,
      address: dto.address,
    });
    await this.patientRepo.save(patient);

    return { message: 'Patient registered successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return { access_token: token };
  }

  async getProfile(userId: number) {
    return await this.usersRepo.findOne({ where: { id: userId } });
  }
}

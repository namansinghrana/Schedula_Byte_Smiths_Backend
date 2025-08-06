// src/doctor/doctor.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async getAllDoctors(): Promise<Doctor[]> {
    return await this.doctorRepo.find({
      relations: ['user'],
      select: {
        user: {
          id: true,
          name: true,
        },
        specialization: true,
        experience: true,
        defaultSlotDuration: true,
      },
    });
  }

  async getDoctorById(user_id: number): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({
      where: { user_id },
      relations: ['user'],
      select: {
        user: {
          id: true,
          name: true,
        },
        specialization: true,
        experience: true,
        defaultSlotDuration: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async updateDoctor(
    user_id: number,
    updateDto: UpdateDoctorDto,
  ): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({ where: { user_id } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    Object.assign(doctor, updateDto);
    return this.doctorRepo.save(doctor);
  }
}

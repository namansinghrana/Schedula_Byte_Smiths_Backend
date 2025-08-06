import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async getPatientById(userId: number): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async updatePatientProfile(
    userId: number,
    updateData: Partial<Patient>,
  ): Promise<Patient> {
    const patient = await this.getPatientById(userId);
    Object.assign(patient, updateData);
    return this.patientRepository.save(patient);
  }
}

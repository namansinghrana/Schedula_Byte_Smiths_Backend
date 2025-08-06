import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/patients')
@UseGuards(JwtGuard, RolesGuard)
@Roles('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get(':id')
  async getPatient(@Param('id', ParseIntPipe) id: number) {
    return this.patientService.getPatientById(id);
  }

  @Patch(':id')
  async updatePatient(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData,
  ) {
    return this.patientService.updatePatientProfile(id, updateData);
  }
}

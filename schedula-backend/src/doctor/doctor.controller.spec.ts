import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { JwtGuard } from '../auth/jwt.guard';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Controller('api/doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  getAllDoctors() {
    return this.doctorService.getAllDoctors();
  }

  @Get(':id')
  getDoctorById(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.getDoctorById(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  updateDoctor(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDoctorDto,
  ) {
    return this.doctorService.updateDoctor(id, updateDto);
  }
}

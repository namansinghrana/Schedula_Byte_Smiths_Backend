import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('api/appointments')
@UseGuards(JwtGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(req.user.id, dto);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    const userId = req.user.id; // or req.user.id depending on your token payload
    const role = req.user.role;
    return this.appointmentService.rescheduleAppointment(id, userId, role, dto);
  }

  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.cancel(id);
  }

  @Get('patient/:id')
  getPatientAppointments(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.getForPatient(id);
  }

  @Get('doctor/:id')
  getDoctorAppointments(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.getForDoctor(id);
  }

  @Patch(':id/cancel')
@UseGuards(JwtGuard) // optional, if protected
cancelAppointment(@Param('id', ParseIntPipe) id: number) {
  return this.appointmentService.cancelMidSession(id);
}
 @Patch(':id/cancel-mid-session')
@UseGuards(JwtGuard)
async cancelMidSession(@Param('id', ParseIntPipe) id: number) {
  return this.appointmentService.cancelMidSession(id);
}

  @Patch(':id/no-show')
  markNoShow(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.markNoShowAndReallocate(id);
  }
}

// elastic-scheduling.controller.ts
import { Body, Controller, Param, Patch, Post, ParseIntPipe } from '@nestjs/common';
import { ElasticSchedulingService } from './elasticScheduling.service';
import { UpdateDoctorStatusDto } from './dto/update-doctor-status.dto';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@Controller('api/elastic-scheduling')
export class ElasticSchedulingController {
  constructor(private readonly elasticService: ElasticSchedulingService) {}
  
  @Patch('doctor/:doctorId/status')
  updateDoctorStatus(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: UpdateDoctorStatusDto,
  ) {
    return this.elasticService.updateDoctorStatus(doctorId, dto);
  }

  // NEW ENDPOINT: Bulk reschedule for unavailable doctor
  @Post('doctor/:doctorId/bulk-reschedule')
  async bulkRescheduleForUnavailableDoctor(
    @Param('doctorId', ParseIntPipe) doctorId: number,
  ) {
    return this.elasticService.handleDoctorUnavailable(doctorId);
  }
}

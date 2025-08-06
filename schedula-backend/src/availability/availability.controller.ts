import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('api/doctors/:doctorId')
@UseGuards(JwtGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('sessions')
  createSession(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: CreateSessionDto,
  ) {
    return this.availabilityService.createSession(doctorId, dto);
  }

  @Get('sessions')
  getSessions(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.availabilityService.getSessionsForDoctor(doctorId);
  }

  @Post('slots')
  createSlot(@Body() dto: CreateSlotDto) {
    return this.availabilityService.createSlot(dto);
  }

  @Delete('slots/:slotId')
  deleteSlot(@Param('slotId', ParseIntPipe) slotId: number) {
    return this.availabilityService.deleteSlot(slotId);
  }

  @Delete('sessions/:sessionId')
  deleteSession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.availabilityService.deleteSession(sessionId);
  }

  @Post('sessions/:sessionId/toggle')
  toggleSession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.availabilityService.toggleSession(sessionId);
  }

  @Post('slots/expand')
  async expandSlot(@Body() dto: import('./dto/expand-slot.dto').ExpandSlotDto) {
    // Calls service to expand slot and returns warnings/affected appointments
    return await this.availabilityService.expandSlot(dto.slotId, dto.newDuration);
  }

  @Post('slots/shrink')
  async shrinkSlot(@Body() dto: import('./dto/shrink-slot.dto').ShrinkSlotDto) {
    // Calls service to shrink slot and returns warnings/affected appointments
    return await this.availabilityService.shrinkSlot(dto.slotId, dto.newDuration);
  }
}

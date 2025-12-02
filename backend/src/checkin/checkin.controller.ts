import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CheckinService } from './checkin.service';
import { ValidateQrCodeDto } from './dto/validate-qrcode.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Check-in')
@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Get('reservations/:id/qrcode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate QR code for reservation' })
  async generateQrCode(
    @Param('id') reservationId: string,
    @Request() req,
  ) {
    return this.checkinService.generateQrCode(
      reservationId,
      req.user.userId,
      req.user.role,
    );
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate QR code (Admin only)' })
  async validateQrCode(@Body() dto: ValidateQrCodeDto) {
    return this.checkinService.validateQrCode(dto);
  }

  @Post('reservations/:id/checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform check-in (Admin only)' })
  async performCheckIn(@Param('id') reservationId: string) {
    return this.checkinService.performCheckIn(reservationId);
  }

  @Post('reservations/:id/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform check-out (Admin only)' })
  async performCheckOut(@Param('id') reservationId: string) {
    return this.checkinService.performCheckOut(reservationId);
  }
}


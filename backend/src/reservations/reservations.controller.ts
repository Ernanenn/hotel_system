import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  create(@Body() createReservationDto: CreateReservationDto, @Request() req) {
    return this.reservationsService.create(
      createReservationDto,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations (client sees only their own)' })
  findAll(@Request() req) {
    return this.reservationsService.findAll(
      req.user.userId,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.reservationsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update reservation (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Request() req,
  ) {
    return this.reservationsService.update(
      id,
      updateReservationDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel reservation' })
  cancel(@Param('id') id: string, @Request() req) {
    return this.reservationsService.cancel(id, req.user.userId, req.user.role);
  }
}


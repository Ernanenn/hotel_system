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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserReservationsQueryDto } from './dto/user-reservations-query.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ExportDataDto } from './dto/export-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('me/reservations')
  @ApiOperation({ summary: 'Get current user reservations with filters and pagination' })
  getUserReservations(@Request() req, @Query() query: UserReservationsQueryDto) {
    return this.usersService.getUserReservations(req.user.id, query);
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get current user notification preferences' })
  getPreferences(@Request() req) {
    return this.usersService.getPreferences(req.user.id);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update current user notification preferences' })
  updatePreferences(@Request() req, @Body() updatePreferencesDto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(req.user.id, updatePreferencesDto);
  }

  @Get('me/export-data')
  @ApiOperation({ summary: 'Export user data (GDPR compliance)' })
  async exportData(@Request() req, @Query() exportDataDto: ExportDataDto) {
    const data = await this.usersService.exportUserData(
      req.user.id,
      exportDataDto.format || 'json',
    );

    if (exportDataDto.format === 'csv') {
      return {
        data: data,
        contentType: 'text/csv',
        filename: `user-data-${req.user.id}-${Date.now()}.csv`,
      };
    }

    return data;
  }

  @Delete('me/account')
  @ApiOperation({ summary: 'Delete user account with data anonymization (GDPR compliance)' })
  async deleteAccount(@Request() req) {
    await this.usersService.deleteAccount(req.user.id);
    return {
      message: 'Conta excluída com sucesso. Seus dados foram anonimizados.',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}


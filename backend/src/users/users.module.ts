import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreferences, Reservation])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}


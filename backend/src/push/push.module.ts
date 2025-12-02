import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { UserPreferences } from '../users/entities/user-preferences.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferences])],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}


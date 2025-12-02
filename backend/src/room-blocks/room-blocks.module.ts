import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomBlocksService } from './room-blocks.service';
import { RoomBlocksController } from './room-blocks.controller';
import { RoomBlock } from './entities/room-block.entity';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [TypeOrmModule.forFeature([RoomBlock]), RoomsModule],
  controllers: [RoomBlocksController],
  providers: [RoomBlocksService],
  exports: [RoomBlocksService],
})
export class RoomBlocksModule {}


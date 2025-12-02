import { PartialType } from '@nestjs/swagger';
import { CreateRoomBlockDto } from './create-room-block.dto';

export class UpdateRoomBlockDto extends PartialType(CreateRoomBlockDto) {}


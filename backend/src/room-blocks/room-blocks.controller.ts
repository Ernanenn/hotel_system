import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomBlocksService } from './room-blocks.service';
import { CreateRoomBlockDto } from './dto/create-room-block.dto';
import { UpdateRoomBlockDto } from './dto/update-room-block.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Room Blocks')
@Controller('room-blocks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class RoomBlocksController {
  constructor(private readonly roomBlocksService: RoomBlocksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room block (Admin only)' })
  create(@Body() createRoomBlockDto: CreateRoomBlockDto) {
    return this.roomBlocksService.create(createRoomBlockDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all room blocks (Admin only)' })
  findAll(@Query('roomId') roomId?: string) {
    return this.roomBlocksService.findAll(roomId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room block by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.roomBlocksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update room block (Admin only)' })
  update(@Param('id') id: string, @Body() updateRoomBlockDto: UpdateRoomBlockDto) {
    return this.roomBlocksService.update(id, updateRoomBlockDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete room block (Admin only)' })
  remove(@Param('id') id: string) {
    return this.roomBlocksService.remove(id);
  }
}


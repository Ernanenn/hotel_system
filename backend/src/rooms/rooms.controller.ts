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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { RoomAvailabilityDto } from './dto/room-availability.dto';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('availability')
  @ApiOperation({ summary: 'Check room availability' })
  async checkAvailability(@Query() checkAvailabilityDto: CheckAvailabilityDto) {
    return this.roomsService.checkAvailability(checkAvailabilityDto);
  }

  @Get('availability/calendar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get room availability calendar (Admin only)' })
  getAvailabilityCalendar(@Query() availabilityDto: RoomAvailabilityDto) {
    return this.roomsService.getAvailabilityCalendar(availabilityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter rooms with pagination' })
  async search(@Query() searchDto: SearchRoomsDto) {
    return this.roomsService.search(searchDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all available rooms (legacy endpoint)' })
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new room (Admin only)' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update room (Admin only)' })
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload image for room (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadRoomImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const room = await this.roomsService.findOne(id);
    const result = await this.uploadService.uploadFile(file, 'rooms');
    
    // Atualizar URL da imagem no quarto
    await this.roomsService.update(id, { imageUrl: result.url });
    
    return {
      message: 'Imagem enviada com sucesso',
      url: result.url,
      room: await this.roomsService.findOne(id),
    };
  }

  @Delete(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete room image (Admin only)' })
  async deleteRoomImage(@Param('id') id: string) {
    const room = await this.roomsService.findOne(id);
    
    if (room.imageUrl) {
      await this.uploadService.deleteFile(room.imageUrl);
      await this.roomsService.update(id, { imageUrl: null });
    }
    
    return {
      message: 'Imagem deletada com sucesso',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete room (Admin only)' })
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}


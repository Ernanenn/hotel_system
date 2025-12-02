import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('rooms')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload de imagem de quarto (Admin only)' })
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
    const result = await this.uploadService.uploadFile(file, 'rooms');
    return {
      message: 'Imagem enviada com sucesso',
      url: result.url,
      fileName: result.fileName,
    };
  }

  @Post('rooms/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload de múltiplas imagens de quarto (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadMultipleRoomImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    const results = await this.uploadService.uploadFiles(files, 'rooms');
    return {
      message: `${results.length} imagem(ns) enviada(s) com sucesso`,
      files: results,
    };
  }

  @Delete(':fileUrl')
  @ApiOperation({ summary: 'Deletar imagem (Admin only)' })
  async deleteImage(@Param('fileUrl') fileUrl: string) {
    const decodedUrl = decodeURIComponent(fileUrl);
    await this.uploadService.deleteFile(decodedUrl);
    return {
      message: 'Imagem deletada com sucesso',
    };
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Listar imagens de quartos (Admin only)' })
  async listRoomImages() {
    const files = await this.uploadService.listFiles('rooms');
    return {
      files,
      count: files.length,
    };
  }
}


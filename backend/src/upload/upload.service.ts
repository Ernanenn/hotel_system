import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream, existsSync, mkdirSync, unlinkSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

export enum StorageType {
  LOCAL = 'local',
  S3 = 's3',
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly storageType: StorageType;
  private readonly uploadDir: string;
  private readonly s3Client: S3Client | null = null;
  private readonly s3Bucket: string | null = null;
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(private configService: ConfigService) {
    this.storageType =
      (this.configService.get<string>('STORAGE_TYPE') as StorageType) ||
      StorageType.LOCAL;
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || 'uploads';

    // Configurar S3 se necessário
    if (this.storageType === StorageType.S3) {
      this.s3Bucket = this.configService.get<string>('AWS_S3_BUCKET');
      const awsRegion = this.configService.get<string>('AWS_REGION') || 'us-east-1';

      this.s3Client = new S3Client({
        region: awsRegion,
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
          secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
        },
      });

      if (!this.s3Bucket) {
        throw new Error('AWS_S3_BUCKET is required when using S3 storage');
      }
    } else {
      // Criar diretório de upload local se não existir
      const uploadPath = join(process.cwd(), this.uploadDir);
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
        this.logger.log(`Created upload directory: ${uploadPath}`);
      }
    }
  }

  /**
   * Valida o arquivo antes do upload
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Tipos permitidos: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Gera um nome único para o arquivo
   */
  generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Faz upload de arquivo para armazenamento local
   */
  async uploadLocal(file: Express.Multer.File, subfolder = 'rooms'): Promise<string> {
    this.validateFile(file);

    const fileName = this.generateFileName(file.originalname);
    const folderPath = join(process.cwd(), this.uploadDir, subfolder);
    const filePath = join(folderPath, fileName);

    // Criar subpasta se não existir
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    // Salvar arquivo
    writeFileSync(filePath, file.buffer);

    // Retornar URL relativa
    return `/uploads/${subfolder}/${fileName}`;
  }

  /**
   * Faz upload de arquivo para S3
   */
  async uploadS3(file: Express.Multer.File, subfolder = 'rooms'): Promise<string> {
    this.validateFile(file);

    if (!this.s3Client || !this.s3Bucket) {
      throw new Error('S3 client not configured');
    }

    const fileName = this.generateFileName(file.originalname);
    const key = `${subfolder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    // Retornar URL pública do S3
    const publicUrl = `https://${this.s3Bucket}.s3.amazonaws.com/${key}`;
    return publicUrl;
  }

  /**
   * Faz upload de arquivo (local ou S3)
   */
  async uploadFile(
    file: Express.Multer.File,
    subfolder = 'rooms',
  ): Promise<{ url: string; fileName: string }> {
    let url: string;

    if (this.storageType === StorageType.S3) {
      url = await this.uploadS3(file, subfolder);
    } else {
      url = await this.uploadLocal(file, subfolder);
    }

    return {
      url,
      fileName: file.originalname,
    };
  }

  /**
   * Faz upload de múltiplos arquivos
   */
  async uploadFiles(
    files: Express.Multer.File[],
    subfolder = 'rooms',
  ): Promise<{ url: string; fileName: string }[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, subfolder));
    return Promise.all(uploadPromises);
  }

  /**
   * Deleta arquivo do armazenamento local
   */
  async deleteLocal(fileUrl: string): Promise<void> {
    const filePath = join(process.cwd(), fileUrl);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      this.logger.log(`Deleted file: ${filePath}`);
    }
  }

  /**
   * Deleta arquivo do S3
   */
  async deleteS3(fileUrl: string): Promise<void> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new Error('S3 client not configured');
    }

    // Extrair key da URL
    const key = fileUrl.replace(`https://${this.s3Bucket}.s3.amazonaws.com/`, '');

    const command = new DeleteObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`Deleted file from S3: ${key}`);
  }

  /**
   * Deleta arquivo (local ou S3)
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (this.storageType === StorageType.S3) {
      await this.deleteS3(fileUrl);
    } else {
      await this.deleteLocal(fileUrl);
    }
  }

  /**
   * Lista arquivos do armazenamento local
   */
  async listLocal(subfolder = 'rooms'): Promise<string[]> {
    const folderPath = join(process.cwd(), this.uploadDir, subfolder);
    if (!existsSync(folderPath)) {
      return [];
    }

    const files = readdirSync(folderPath)
      .filter((file) => {
        const filePath = join(folderPath, file);
        return statSync(filePath).isFile();
      })
      .map((file) => `/uploads/${subfolder}/${file}`);

    return files;
  }

  /**
   * Lista arquivos do S3
   */
  async listS3(subfolder = 'rooms'): Promise<string[]> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new Error('S3 client not configured');
    }

    const command = new ListObjectsV2Command({
      Bucket: this.s3Bucket,
      Prefix: `${subfolder}/`,
    });

    const response = await this.s3Client.send(command);
    const files =
      response.Contents?.map(
        (object) => `https://${this.s3Bucket}.s3.amazonaws.com/${object.Key}`,
      ) || [];

    return files;
  }

  /**
   * Lista arquivos (local ou S3)
   */
  async listFiles(subfolder = 'rooms'): Promise<string[]> {
    if (this.storageType === StorageType.S3) {
      return this.listS3(subfolder);
    } else {
      return this.listLocal(subfolder);
    }
  }
}


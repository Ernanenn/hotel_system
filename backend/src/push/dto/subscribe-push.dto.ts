import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject } from 'class-validator';

export class SubscribePushDto {
  @ApiProperty({ description: 'Push subscription object (endpoint, keys)' })
  @IsObject()
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}


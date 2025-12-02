import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PushService } from './push.service';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Push Notifications')
@Controller('push')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  async subscribe(@Body() subscribeDto: SubscribePushDto, @Request() req: any) {
    await this.pushService.subscribe(req.user.userId, subscribeDto);
    return { message: 'Inscrito em push notifications com sucesso' };
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  async unsubscribe(@Request() req: any) {
    await this.pushService.unsubscribe(req.user.userId);
    return { message: 'Inscrição removida com sucesso' };
  }
}


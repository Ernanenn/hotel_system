import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('reservations/:reservationId/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create mock checkout session (simulado)' })
  async createCheckout(
    @Param('reservationId') reservationId: string,
    @Request() req,
  ) {
    const url = await this.paymentsService.createCheckoutSession(reservationId);
    return { url };
  }

  @Post('reservations/:reservationId/mock-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Processar pagamento simulado' })
  async processMockPayment(
    @Param('reservationId') reservationId: string,
    @Body() body: { sessionId: string },
    @Request() req,
  ) {
    await this.paymentsService.processMockPayment(reservationId, body.sessionId);
    return { success: true, message: 'Pagamento processado com sucesso (simulado)' };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook endpoint (reservado para futuras integrações)' })
  async handleWebhook(
    @Headers('signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    await this.paymentsService.handleWebhook(signature, req.rawBody);
    return { received: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments' })
  findAll(@Request() req) {
    return this.paymentsService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}


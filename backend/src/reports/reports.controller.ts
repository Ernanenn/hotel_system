import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { RevenueReportDto } from './dto/revenue-report.dto';
import { OccupancyReportDto } from './dto/occupancy-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report (Admin only)' })
  async getRevenueReport(@Query() dto: RevenueReportDto) {
    return this.reportsService.getRevenueReport(dto);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Get occupancy report (Admin only)' })
  async getOccupancyReport(@Query() dto: OccupancyReportDto) {
    return this.reportsService.getOccupancyReport(dto);
  }

  @Get('popular-rooms')
  @ApiOperation({ summary: 'Get most popular rooms (Admin only)' })
  async getPopularRooms(@Query('limit') limit?: number) {
    return this.reportsService.getPopularRooms(limit ? parseInt(limit.toString(), 10) : 10);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get general statistics (Admin only)' })
  async getStatistics() {
    return this.reportsService.getStatistics();
  }

  @Get('revenue/export/excel')
  @ApiOperation({ summary: 'Export revenue report to Excel (Admin only)' })
  async exportRevenueToExcel(@Query() dto: RevenueReportDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportRevenueToExcel(dto);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.xlsx');
    res.send(buffer);
  }

  @Get('revenue/export/pdf')
  @ApiOperation({ summary: 'Export revenue report to PDF (Admin only)' })
  async exportRevenueToPDF(@Query() dto: RevenueReportDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportRevenueToPDF(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.pdf');
    res.send(buffer);
  }
}


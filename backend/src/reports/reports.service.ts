import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Room, RoomType } from '../rooms/entities/room.entity';
import { RevenueReportDto, RevenueGroupBy } from './dto/revenue-report.dto';
import { OccupancyReportDto } from './dto/occupancy-report.dto';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
  ) {}

  async getRevenueReport(dto: RevenueReportDto) {
    const { startDate, endDate, groupBy = RevenueGroupBy.DAY, roomId } = dto;

    const query = this.reservationsRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('reservation.payment', 'payment')
      .where('reservation.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
      .andWhere('payment.status = :completed', { completed: PaymentStatus.COMPLETED });

    if (startDate) {
      query.andWhere('reservation.checkIn >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('reservation.checkOut <= :endDate', { endDate });
    }
    if (roomId) {
      query.andWhere('reservation.roomId = :roomId', { roomId });
    }

    const reservations = await query.getMany();

    let groupedData: any = {};

    reservations.forEach((reservation) => {
      const totalPrice = Number(reservation.totalPrice);
      let key: string;

      switch (groupBy) {
        case RevenueGroupBy.DAY:
          key = format(new Date(reservation.checkIn), 'yyyy-MM-dd', { locale: ptBR });
          break;
        case RevenueGroupBy.WEEK:
          const weekStart = startOfWeek(new Date(reservation.checkIn), { locale: ptBR });
          key = `Semana ${format(weekStart, 'yyyy-MM-dd', { locale: ptBR })}`;
          break;
        case RevenueGroupBy.MONTH:
          key = format(new Date(reservation.checkIn), 'yyyy-MM', { locale: ptBR });
          break;
        case RevenueGroupBy.YEAR:
          key = format(new Date(reservation.checkIn), 'yyyy', { locale: ptBR });
          break;
        case RevenueGroupBy.ROOM:
          key = reservation.room?.number || 'Desconhecido';
          break;
        case RevenueGroupBy.TYPE:
          key = reservation.room?.type || 'Desconhecido';
          break;
        default:
          key = format(new Date(reservation.checkIn), 'yyyy-MM-dd', { locale: ptBR });
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          totalRevenue: 0,
          reservationCount: 0,
          averageRevenue: 0,
        };
      }

      groupedData[key].totalRevenue += totalPrice;
      groupedData[key].reservationCount += 1;
    });

    // Calcular média
    Object.keys(groupedData).forEach((key) => {
      groupedData[key].averageRevenue =
        groupedData[key].totalRevenue / groupedData[key].reservationCount;
    });

    const totalRevenue = reservations.reduce(
      (sum, r) => sum + Number(r.totalPrice),
      0,
    );

    return {
      data: Object.values(groupedData),
      summary: {
        totalRevenue,
        totalReservations: reservations.length,
        averageRevenue: totalRevenue / (reservations.length || 1),
        groupBy,
      },
    };
  }

  async getOccupancyReport(dto: OccupancyReportDto) {
    const { startDate, endDate, roomId } = dto;

    const start = startDate ? parseISO(startDate) : startOfMonth(new Date());
    const end = endDate ? parseISO(endDate) : endOfMonth(new Date());

    // Buscar todas as reservas no período
    const reservationsQuery = this.reservationsRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .where('reservation.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
      .andWhere('reservation.checkIn <= :end', { end })
      .andWhere('reservation.checkOut >= :start', { start });

    if (roomId) {
      reservationsQuery.andWhere('reservation.roomId = :roomId', { roomId });
    }

    const reservations = await reservationsQuery.getMany();

    // Buscar todos os quartos
    const roomsQuery = this.roomsRepository.createQueryBuilder('room');
    if (roomId) {
      roomsQuery.where('room.id = :roomId', { roomId });
    }
    const rooms = await roomsQuery.getMany();

    // Calcular ocupação por quarto
    const occupancyByRoom = rooms.map((room) => {
      const roomReservations = reservations.filter((r) => r.roomId === room.id);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const occupiedDays = roomReservations.reduce((sum, res) => {
        const checkIn = new Date(res.checkIn);
        const checkOut = new Date(res.checkOut);
        const resStart = checkIn > start ? checkIn : start;
        const resEnd = checkOut < end ? checkOut : end;
        const days = Math.ceil((resEnd.getTime() - resStart.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);

      return {
        roomId: room.id,
        roomNumber: room.number,
        roomType: room.type,
        totalDays,
        occupiedDays,
        occupancyRate: totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0,
        reservationCount: roomReservations.length,
      };
    });

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalOccupiedDays = occupancyByRoom.reduce((sum, room) => sum + room.occupiedDays, 0);
    const totalAvailableDays = rooms.length * totalDays;
    const overallOccupancyRate =
      totalAvailableDays > 0 ? (totalOccupiedDays / totalAvailableDays) * 100 : 0;

    return {
      period: {
        startDate: format(start, 'yyyy-MM-dd', { locale: ptBR }),
        endDate: format(end, 'yyyy-MM-dd', { locale: ptBR }),
        totalDays,
      },
      rooms: occupancyByRoom,
      summary: {
        totalRooms: rooms.length,
        totalAvailableDays,
        totalOccupiedDays,
        overallOccupancyRate,
      },
    };
  }

  async getPopularRooms(limit: number = 10) {
    const rooms = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoin('room.reservations', 'reservation')
      .leftJoin('room.reviews', 'review')
      .where('reservation.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
      .select([
        'room.id',
        'room.number',
        'room.type',
        'room.pricePerNight',
        'room.ratingAverage',
      ])
      .addSelect('COUNT(DISTINCT reservation.id)', 'reservationCount')
      .addSelect('COUNT(DISTINCT review.id)', 'reviewCount')
      .addSelect('SUM(reservation.totalPrice)', 'totalRevenue')
      .groupBy('room.id')
      .orderBy('reservationCount', 'DESC')
      .addOrderBy('totalRevenue', 'DESC')
      .limit(limit)
      .getRawMany();

    return rooms.map((room) => ({
      id: room.room_id,
      number: room.room_number,
      type: room.room_type,
      pricePerNight: Number(room.room_pricePerNight),
      ratingAverage: Number(room.room_ratingAverage) || 0,
      reservationCount: parseInt(room.reservationCount, 10),
      reviewCount: parseInt(room.reviewCount, 10),
      totalRevenue: Number(room.totalRevenue) || 0,
    }));
  }

  async getStatistics() {
    const [
      totalRooms,
      totalReservations,
      totalRevenue,
      totalUsers,
      occupancyRate,
    ] = await Promise.all([
      this.roomsRepository.count(),
      this.reservationsRepository.count({
        where: { status: ReservationStatus.CONFIRMED },
      }),
      this.paymentsRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne(),
      this.reservationsRepository
        .createQueryBuilder('reservation')
        .select('COUNT(DISTINCT reservation.userId)', 'count')
        .getRawOne(),
      this.calculateOverallOccupancyRate(),
    ]);

    return {
      totalRooms,
      totalReservations,
      totalRevenue: Number(totalRevenue?.total || 0),
      totalUsers: parseInt(totalUsers?.count || '0', 10),
      occupancyRate,
      averageRating: await this.getAverageRating(),
    };
  }

  private async calculateOverallOccupancyRate(): Promise<number> {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const reservations = await this.reservationsRepository
      .createQueryBuilder('reservation')
      .where('reservation.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
      .andWhere('reservation.checkIn <= :end', { end })
      .andWhere('reservation.checkOut >= :start', { start })
      .getMany();

    const rooms = await this.roomsRepository.count();
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalAvailableDays = rooms * totalDays;

    const occupiedDays = reservations.reduce((sum, res) => {
      const checkIn = new Date(res.checkIn);
      const checkOut = new Date(res.checkOut);
      const resStart = checkIn > start ? checkIn : start;
      const resEnd = checkOut < end ? checkOut : end;
      const days = Math.ceil((resEnd.getTime() - resStart.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return totalAvailableDays > 0 ? (occupiedDays / totalAvailableDays) * 100 : 0;
  }

  private async getAverageRating(): Promise<number> {
    const result = await this.roomsRepository
      .createQueryBuilder('room')
      .select('AVG(room.ratingAverage)', 'average')
      .where('room.ratingAverage > 0')
      .getRawOne();

    return Number(result?.average || 0);
  }

  async exportRevenueToExcel(dto: RevenueReportDto): Promise<Buffer> {
    const report = await this.getRevenueReport(dto);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório de Receita');

    // Cabeçalhos
    worksheet.columns = [
      { header: 'Período', key: 'period', width: 20 },
      { header: 'Receita Total', key: 'totalRevenue', width: 15 },
      { header: 'Nº Reservas', key: 'reservationCount', width: 15 },
      { header: 'Receita Média', key: 'averageRevenue', width: 15 },
    ];

    // Dados
    report.data.forEach((row: any) => {
      worksheet.addRow({
        period: row.period,
        totalRevenue: row.totalRevenue,
        reservationCount: row.reservationCount,
        averageRevenue: row.averageRevenue,
      });
    });

    // Resumo
    worksheet.addRow({});
    worksheet.addRow({
      period: 'TOTAL',
      totalRevenue: report.summary.totalRevenue,
      reservationCount: report.summary.totalReservations,
      averageRevenue: report.summary.averageRevenue,
    });

    // Formatação
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(worksheet.rowCount).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportRevenueToPDF(dto: RevenueReportDto): Promise<Buffer> {
    const report = await this.getRevenueReport(dto);
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {});

    doc.fontSize(20).text('Relatório de Receita', { align: 'center' });
    doc.moveDown();

    if (dto.startDate || dto.endDate) {
      doc.fontSize(12).text(
        `Período: ${dto.startDate || 'Início'} até ${dto.endDate || 'Fim'}`,
      );
      doc.moveDown();
    }

    doc.fontSize(14).text('Detalhamento:', { underline: true });
    doc.moveDown();

    report.data.forEach((row: any) => {
      doc.fontSize(10).text(`${row.period}:`, { continued: true });
      doc.text(` R$ ${row.totalRevenue.toFixed(2)} (${row.reservationCount} reservas)`);
    });

    doc.moveDown();
    doc.fontSize(14).text('Resumo:', { underline: true });
    doc.moveDown();
    doc.text(`Receita Total: R$ ${report.summary.totalRevenue.toFixed(2)}`);
    doc.text(`Total de Reservas: ${report.summary.totalReservations}`);
    doc.text(`Receita Média: R$ ${report.summary.averageRevenue.toFixed(2)}`);

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}


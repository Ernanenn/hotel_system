import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Reservations (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let roomId: string;
  let reservationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login
    const testEmail = `test${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      });

    accessToken = loginRes.body.access_token;

    // Get a room
    const roomsRes = await request(app.getHttpServer())
      .get('/api/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    if (roomsRes.body.length > 0) {
      roomId = roomsRes.body[0].id;
    } else {
      // Create a room if none exists
      const createRoomRes = await request(app.getHttpServer())
        .post('/api/rooms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          number: '101',
          type: 'single',
          pricePerNight: 150,
          maxOccupancy: 2,
        });
      roomId = createRoomRes.body.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /reservations', () => {
    it('should create a reservation', () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 3);

      return request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          roomId,
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('roomId');
          expect(res.body).toHaveProperty('checkIn');
          expect(res.body).toHaveProperty('checkOut');
          reservationId = res.body.id;
        });
    });

    it('should return 400 for past check-in date', () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() - 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 1);

      return request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          roomId,
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
        })
        .expect(400);
    });
  });

  describe('GET /reservations', () => {
    it('should return user reservations', () => {
      return request(app.getHttpServer())
        .get('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /reservations/:id', () => {
    it('should return reservation details', () => {
      return request(app.getHttpServer())
        .get(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(reservationId);
        });
    });
  });
});


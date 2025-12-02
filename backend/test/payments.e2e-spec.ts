import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let reservationId: string;
  let sessionId: string;

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

    // Get a room and create reservation
    const roomsRes = await request(app.getHttpServer())
      .get('/api/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    let roomId: string;
    if (roomsRes.body.length > 0) {
      roomId = roomsRes.body[0].id;
    } else {
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

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 3);

    const reservationRes = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        roomId,
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
      });

    reservationId = reservationRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /payments/checkout', () => {
    it('should create checkout session', () => {
      return request(app.getHttpServer())
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reservationId })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('url');
          expect(res.body.url).toContain('sessionId=');
          sessionId = res.body.url.split('sessionId=')[1];
        });
    });
  });

  describe('POST /payments/simulate', () => {
    it('should simulate payment', () => {
      return request(app.getHttpServer())
        .post('/api/payments/simulate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sessionId })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('completed');
        });
    });

    it('should return 404 for invalid session', () => {
      return request(app.getHttpServer())
        .post('/api/payments/simulate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sessionId: 'invalid-session' })
        .expect(404);
    });
  });
});


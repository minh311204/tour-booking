import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/api/src/app.module';
import { PrismaService } from './../src/api/src/prisma/prima.service';

describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const email = `auth-e2e-${Date.now()}@example.com`;
  const password = 'Password123!';

  let accessToken = '';
  let refreshToken = '';
  let refreshedAccessToken = '';
  let userId = 0;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (userId > 0) {
      await prisma.blacklistedAccessToken.deleteMany({
        where: { userId },
      });
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      await prisma.resetPasswordToken.deleteMany({
        where: { userId },
      });
      await prisma.user.delete({
        where: { id: userId },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  it('registers a user', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password,
      name: 'Auth E2E',
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe('USER');
    expect(typeof res.body.id).toBe('number');

    userId = res.body.id;
  });

  it('logs in and receives access/refresh tokens', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({
      email,
      password,
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(typeof res.body.jti).toBe('string');

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('refreshes token and returns a new access token', async () => {
    const res = await request(app.getHttpServer()).post('/auth/refresh').send({
      refreshToken,
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.jti).toBe('string');
    expect(res.body.accessToken).not.toBe(accessToken);

    refreshedAccessToken = res.body.accessToken;
  });

  it('returns current user with refreshed access token', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${refreshedAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.email).toBe(email);
  });

  it('logs out and invalidates the current access token', async () => {
    const logoutRes = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${refreshedAccessToken}`)
      .send({});

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('Logged out successfully');

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${refreshedAccessToken}`);

    expect(meRes.status).toBe(401);
  });
});

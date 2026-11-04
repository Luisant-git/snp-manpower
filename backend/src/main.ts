import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express = require('express');
import session = require('express-session');
import connectPgSimple = require('connect-pg-simple');
import { Pool } from 'pg';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.');
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL must be set to persist login sessions.');
  const sessionPool = new Pool({ connectionString: databaseUrl });
  const PostgreSqlSessionStore = connectPgSimple(session);
  const sessionStore = new PostgreSqlSessionStore({
    pool: sessionPool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  });

  app.setGlobalPrefix('api');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of [...frontendOrigins]) {
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        const alternateHost = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
        url.hostname = alternateHost;
        const alternateOrigin = url.origin;
        if (!frontendOrigins.includes(alternateOrigin)) frontendOrigins.push(alternateOrigin);
      }
    } catch {
      throw new Error('FRONTEND_URL must contain valid comma-separated origins.');
    }
  }
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(
    session({
      store: sessionStore,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    }),
  );
  app.enableShutdownHooks();
  app.getHttpServer().on('close', () => {
    sessionStore.close();
    void sessionPool.end();
  });
  await app.listen(Number(process.env.PORT) || 3001);
}

void bootstrap();

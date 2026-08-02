import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dns from 'node:dns';

import { AppModule } from './app.module';

dns.setDefaultResultOrder('ipv4first');

function normalizeApiPrefix(prefix: string): string {
  return prefix.replace(/^\/+|\/+$/g, '');
}

async function bootstrap(): Promise<void> {
  const application = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = application.get(ConfigService);

  const port = configService.getOrThrow<number>('PORT');

  const apiPrefix = normalizeApiPrefix(
    configService.getOrThrow<string>('API_PREFIX'),
  );

  const frontendUrl = configService
    .getOrThrow<string>('FRONTEND_URL')
    .replace(/\/+$/, '');

  application.use(helmet());
  application.use(compression());
  application.use(cookieParser());

  /*
   * FRONTEND_URL must exactly match the browser origin
   * (scheme + host), e.g. https://taskflow-web-9ocr.onrender.com
   * Comma-separated origins are supported for local + production.
   */
  const allowedOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0);

  application.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean | string) => void,
    ) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(requestOrigin)) {
        callback(null, requestOrigin);
        return;
      }

      callback(new Error(`CORS blocked origin: ${requestOrigin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  application.setGlobalPrefix(apiPrefix);

  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  application.enableShutdownHooks();

  /*
   * Render (and most PaaS hosts) require binding 0.0.0.0,
   * not only localhost, or external health/API checks hang.
   */
  await application.listen(port, '0.0.0.0');

  logger.log(`TaskFlow API running at http://0.0.0.0:${port}/${apiPrefix}`);
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}

void bootstrap();

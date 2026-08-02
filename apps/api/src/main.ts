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

  const frontendUrl = configService.getOrThrow<string>('FRONTEND_URL');

  application.use(helmet());
  application.use(compression());
  application.use(cookieParser());

  application.enableCors({
    origin: frontendUrl,
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

  await application.listen(port);

  logger.log(`TaskFlow API running at http://localhost:${port}/${apiPrefix}`);
}

void bootstrap();

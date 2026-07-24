import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { bullBoardLocalOnly } from './infrastructure/bull-board/bull-board-local.middleware';
import { BullBoardService } from './infrastructure/bull-board/bull-board.service';

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

  const nodeEnvironment = configService.getOrThrow<string>('NODE_ENV');

  const bullBoardEnabled =
    configService.getOrThrow<string>('BULL_BOARD_ENABLED') === 'true';

  /*
   * Mount Bull Board before the global Helmet middleware.
   * Bull Board serves its own UI assets, which can otherwise
   * be blocked by Helmet's default content-security policy.
   *
   * It is mounted only in development and is additionally
   * protected by localhost-only middleware.
   */
  if (bullBoardEnabled && nodeEnvironment === 'development') {
    const bullBoardService = application.get(BullBoardService);

    const bullBoardPath = `/${apiPrefix}/admin/queues`;

    bullBoardService.setBasePath(bullBoardPath);

    application.use(
      bullBoardPath,
      bullBoardLocalOnly,
      bullBoardService.getRouter(),
    );

    logger.log(
      `Bull Board available at http://localhost:${port}${bullBoardPath}`,
    );
  } else if (bullBoardEnabled) {
    logger.warn(
      'Bull Board was not mounted because it is allowed only in development',
    );
  }

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

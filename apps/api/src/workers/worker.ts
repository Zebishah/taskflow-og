import { Logger } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';

// import { WorkerModule } from './worker.module';

/*
 * ============================================================================
 * DISABLED — BullMQ worker entrypoint is preserved for later restore only.
 * Do NOT run this file. Reminders run via Nest cron in the API process.
 * Invitation emails send immediately from the API.
 * ============================================================================
 */
async function bootstrap(): Promise<void> {
  Logger.warn(
    'BullMQ worker is disabled. Start the API instead (cron + immediate emails).',
    'WorkerBootstrap',
  );

  /*
  const application = await NestFactory.createApplicationContext(WorkerModule);

  application.enableShutdownHooks();

  Logger.log('TaskFlow background worker is running', 'WorkerBootstrap');
  */
}

void bootstrap();

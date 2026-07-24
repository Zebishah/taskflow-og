import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsInt()
  @Min(60)
  JWT_ACCESS_TTL_SECONDS!: number;

  @IsInt()
  @Min(1)
  @Max(90)
  REFRESH_TOKEN_TTL_DAYS!: number;

  @IsInt()
  @Min(10)
  @Max(15)
  BCRYPT_SALT_ROUNDS!: number;
  @IsIn(['true', 'false'])
  BULL_BOARD_ENABLED!: 'true' | 'false';
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: 'development' | 'test' | 'production';
  @IsUrl({
    require_tld: false,
    protocols: ['redis', 'rediss'],
  })
  REDIS_URL!: string;
  @IsInt()
  @Min(1)
  @Max(60)
  QUEUE_TASK_REMINDER_CONCURRENCY!: number;

  @IsInt()
  @Min(1)
  @Max(10_080)
  TASK_REMINDER_LEAD_MINUTES!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  QUEUE_INVITATION_EMAIL_CONCURRENCY!: number;
}

export function validateEnvironment(
  configuration: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfiguration = plainToInstance(
    EnvironmentVariables,
    configuration,
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfiguration, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfiguration;
}

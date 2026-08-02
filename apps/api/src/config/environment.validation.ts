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

  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: 'development' | 'test' | 'production';

  @IsUrl({
    require_tld: false,
    protocols: ['redis', 'rediss'],
  })
  REDIS_URL!: string;

  @IsInt()
  @Min(1)
  @Max(10_080)
  TASK_REMINDER_LEAD_MINUTES!: number;

  @IsString()
  @IsNotEmpty()
  AWS_REGION!: string;

  @IsString()
  @IsNotEmpty()
  S3_TASK_IMAGES_BUCKET!: string;

  @IsInt()
  @Min(60)
  @Max(900)
  S3_PRESIGNED_URL_TTL_SECONDS!: number;

  @IsInt()
  @Min(1_024)
  @Max(10_485_760)
  TASK_IMAGE_MAX_BYTES!: number;
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

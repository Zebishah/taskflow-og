import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

import {
  allowedTaskImageContentTypes,
  type TaskImageContentType,
} from '../../../infrastructure/storage/storage.constants';

export class CreateTaskImageUploadDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(255)
  public fileName!: string;

  @IsIn(allowedTaskImageContentTypes)
  public contentType!: TaskImageContentType;

  @IsInt()
  @Min(1)
  @Max(10_485_760)
  public sizeBytes!: number;
}

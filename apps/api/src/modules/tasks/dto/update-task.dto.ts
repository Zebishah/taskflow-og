import { Transform } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

import {
  taskPriorityValues,
  type TaskPriority,
} from '../../../database/schema/task-priority.enum';

export class UpdateTaskDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Length(2, 200)
  public title?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  public description?: string | null;

  @IsOptional()
  @IsUUID('4')
  public columnId?: string;

  @IsOptional()
  @IsIn(taskPriorityValues)
  public priority?: TaskPriority;

  @IsOptional()
  @IsUUID('4')
  public assigneeMemberId?: string | null;

  @IsOptional()
  @IsISO8601(
    {
      strict: true,
      strictSeparator: true,
    },
    {
      message: 'dueAt must be a valid ISO 8601 date',
    },
  )
  public dueAt?: string | null;
}

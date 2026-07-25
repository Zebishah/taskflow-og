import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import {
  taskPriorityValues,
  type TaskPriority,
} from '../../../database/schema/task-priority.enum';

export class ListTasksQueryDto {
  @IsOptional()
  @IsUUID('4')
  public columnId?: string;

  @IsOptional()
  @IsIn(taskPriorityValues)
  public priority?: TaskPriority;

  @IsOptional()
  @IsUUID('4')
  public assigneeMemberId?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public search?: string;
}

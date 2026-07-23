import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import {
  taskPriorityValues,
  type TaskPriority,
} from '../../../database/schema/task-priority.enum';
import {
  taskStatusValues,
  type TaskStatus,
} from '../../../database/schema/task-status.enum';

export class ListTasksQueryDto {
  @IsOptional()
  @IsIn(taskStatusValues)
  public status?: TaskStatus;

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

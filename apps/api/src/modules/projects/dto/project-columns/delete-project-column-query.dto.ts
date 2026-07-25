import { IsOptional, IsUUID } from 'class-validator';

export class DeleteProjectColumnQueryDto {
  @IsOptional()
  @IsUUID('4')
  public moveTasksToColumnId?: string;
}

import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import {
  type ProjectColumnColor,
  projectColumnColorValues,
  type ProjectColumnKind,
  projectColumnKindValues,
} from 'src/database/schema';

export class CreateProjectColumnDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 50)
  public name!: string;

  @IsOptional()
  @IsIn(projectColumnColorValues)
  public color?: ProjectColumnColor;

  @IsOptional()
  @IsIn(projectColumnKindValues)
  public kind?: ProjectColumnKind;
}

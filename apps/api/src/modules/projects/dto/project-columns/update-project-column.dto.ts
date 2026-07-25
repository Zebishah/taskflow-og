import { Transform } from 'class-transformer';
import { IsIn, IsString, Length, ValidateIf } from 'class-validator';

import {
  projectColumnColorValues,
  type ProjectColumnColor,
} from '../../../../database/schema/project-column-color.enum';
import {
  projectColumnKindValues,
  type ProjectColumnKind,
} from '../../../../database/schema/project-column-kind.enum';

export class UpdateProjectColumnDto {
  @ValidateIf(
    (_object: UpdateProjectColumnDto, value: unknown) => value !== undefined,
  )
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 50)
  public name?: string;

  @ValidateIf(
    (_object: UpdateProjectColumnDto, value: unknown) => value !== undefined,
  )
  @IsIn(projectColumnColorValues)
  public color?: ProjectColumnColor;

  @ValidateIf(
    (_object: UpdateProjectColumnDto, value: unknown) => value !== undefined,
  )
  @IsIn(projectColumnKindValues)
  public kind?: ProjectColumnKind;
}

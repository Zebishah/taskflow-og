import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Length(2, 100)
  public name!: string;

  @IsString()
  @Length(2, 100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must contain lowercase letters, numbers, and single hyphens only',
  })
  public slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  public description?: string;
}

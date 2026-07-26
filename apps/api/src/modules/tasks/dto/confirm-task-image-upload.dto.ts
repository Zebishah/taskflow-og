import { IsString, MaxLength } from 'class-validator';

export class ConfirmTaskImageUploadDto {
  @IsString()
  @MaxLength(1_024)
  public objectKey!: string;
}

import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTermsandconditionDto {
  @IsString()
  @MaxLength(250)
  title_id: string;

  @IsString()
  @MaxLength(250)
  title_en: string;

  @IsString()
  content_id: string;

  @IsString()
  content_en: string;

  @IsString()
  @MaxLength(250)
  contact_title_id: string;

  @IsString()
  @MaxLength(250)
  contact_title_en: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_active: boolean;
}

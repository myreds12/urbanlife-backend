import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAboutusCtaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
  @IsString()
  title_id: string;
  @IsString()
  title_en: string;
  @IsString()
  description_id: string;
  @IsString()
  description_en: string;
  @IsString()
  button_text: string;
  @IsString()
  button_url: string;
  @IsString()
  cta_button_text: string;
  @IsString()
  cta_button_url: string;
}

import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AboutusStoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @IsNotEmpty()
  @IsString()
  title_en: string;

  @IsNotEmpty()
  @IsString()
  title_id: string;

  @IsNotEmpty()
  @IsString()
  content_id: string;

  @IsNotEmpty()
  @IsString()
  content_en: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AboutusAchievmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @IsString()
  number: string;

  @IsString()
  content_id: string;

  @IsString()
  icon: string;

  @IsString()
  content_en: string;
}

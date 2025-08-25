import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { AboutusStoryDto } from './aboutus-story.dto';
import { AboutusServiceDto } from './aboutus-service.dto';
import { AboutusAchievmentDto } from './aboutus-achievment.dto';
import { CreateAboutusCtaDto } from './aboutus-cta.dto';

export class CreateAboutusDto {
  @IsNotEmpty()
  @IsString()
  title_id: string;
  @IsNotEmpty()
  @IsString()
  title_en: string;
  @IsNotEmpty()
  @IsString()
  content_id: string;
  @IsNotEmpty()
  @IsString()
  content_en: string;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_published?: boolean;

  @Type(() => AboutusStoryDto)
  @ValidateNested({ each: true })
  aboutus_story: AboutusStoryDto;

  @Type(() => AboutusServiceDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Kendaraan content must be a non-empty array',
  })
  aboutus_service: AboutusServiceDto[];

  @Type(() => AboutusAchievmentDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Kendaraan content must be a non-empty array',
  })
  aboutus_achievment: AboutusAchievmentDto[];

  @Type(() => CreateAboutusCtaDto)
  @ValidateNested()
  aboutus_cta: CreateAboutusCtaDto;

  @Type(() => CreateAboutusOperationalDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Operational hours must be a non-empty array',
  })
  aboutus_operational: CreateAboutusOperationalDto[];
}

export class CreateAboutusOperationalDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
  @IsNotEmpty()
  @IsString()
  day: string;
  @IsNotEmpty()
  @IsString()
  time: string;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_highlight: boolean;
}

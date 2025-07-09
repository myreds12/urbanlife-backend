import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { LanguageType } from 'src/common/enum/language-type.enum';

export class TravelPackageContentDto {
  @Type(() => Number)
  @IsOptional()
  id?: number;

  @IsEnum(LanguageType)
  bahasa: LanguageType;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsString()
  itinerary?: string;
}

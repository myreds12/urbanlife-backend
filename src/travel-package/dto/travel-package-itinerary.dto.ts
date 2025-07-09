import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LanguageType } from 'src/common/enum/language-type.enum';

export class TravelPackageItineraryDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsString()
  nama: string;

  @IsEnum(LanguageType)
  bahasa: LanguageType;

  @IsString()
  deskripsi: string;
}

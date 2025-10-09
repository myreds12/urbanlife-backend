import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, Validate, ValidateNested } from 'class-validator';
import { LanguageType } from 'src/common/enum/language-type.enum';
import { TravelPackageItineraryFilesDto } from './travel-package-itinerary-files.dto';

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

  // @IsArray()
  @Type(() => TravelPackageItineraryFilesDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Files Itinerary must be a non-empty array',
  })
  itinerary_files: TravelPackageItineraryFilesDto[];
}

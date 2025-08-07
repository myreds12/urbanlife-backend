import { IsInt, IsNumber, IsOptional, IsString, Validate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TravelPackageContentDto } from './travel-package-content.dto';
import { TravelPackageItineraryDto } from './travel-package-itinerary.dto';

export class CreateTravelPackageDto {
  @Type(() => Number)
  @IsInt()
  lokasi_id: number;

  @Type(() => Number)
  @IsInt()
  category_id: number;

  @IsString()
  nama: string;

  @Type(() => Number)
  @IsNumber()
  harga_dewasa: number;

  @Type(() => Number)
  @IsNumber()
  harga_anak: number;

  @IsOptional()
  @IsString()
  durasi: string;

  @Type(() => TravelPackageContentDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Kendaraan content must be a non-empty array',
  })
  travel_package_content: TravelPackageContentDto[];

  @Type(() => TravelPackageItineraryDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Kendaraan content must be a non-empty array',
  })
  travel_package_itinerary: TravelPackageItineraryDto[];
}

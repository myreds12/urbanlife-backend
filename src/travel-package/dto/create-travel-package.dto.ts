import { IsArray, IsInt, IsNumber, IsOptional, IsString, Validate, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TravelPackageContentDto } from './travel-package-content.dto';
import { TravelPackageItineraryDto } from './travel-package-itinerary.dto';
import { TravelPackagePricesDto } from './travel-package-prices.dto';

export class CreateTravelPackageDto {
  @Type(() => Number)
  @IsInt()
  lokasi_id: number;

  @Type(() => Number)
  @IsInt()
  category_id: number;

  @Type(() => Number)
  @IsInt()
  guide_id: number;

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

  @IsOptional()
  @IsString()
  top_attraction?: string;

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
  
  @Type(() => TravelPackagePricesDto)
  @ValidateNested({ each: true })
  travel_package_prices: TravelPackagePricesDto[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (value ? value.map((item: string) => parseInt(item, 10)) : []), { toClassOnly: true })
  travel_package_deleted_itinerary_file?: number[];
}

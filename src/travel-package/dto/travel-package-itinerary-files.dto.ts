import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class TravelPackageItineraryFilesDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsString()
  nama_file: string;

  @IsString()
  url: string;
}

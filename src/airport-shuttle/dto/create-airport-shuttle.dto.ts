import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AirportShuttleContentDto {
  @IsOptional()
  @IsString()
  bahasa?: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsString()
  kebijakan?: string;
}

export class AirportShuttlePriceDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;
  
  @IsString()
  nama: string;

  @Type(() => Number)
  @IsNumber()
  harga: number;
}

export class CreateAirportShuttleDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lokasi_id?: number;

  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  top_attraction?: boolean;

  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @Type(() => AirportShuttleContentDto)
  @ValidateNested({ each: true })
  airport_shuttle_content: AirportShuttleContentDto[];

  @IsOptional()
  @IsArray()
  airport_shuttle_file?: any[];

  @Type(() => AirportShuttlePriceDto)
  @ValidateNested({ each: true })
  airport_shuttle_price: AirportShuttlePriceDto[];
}

export class UpdatePopularStatusDto {
  @Type(() => Number)
  id?: number;

  @IsBoolean()
  is_popular: boolean;
}

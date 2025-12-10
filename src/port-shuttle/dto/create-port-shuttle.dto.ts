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

export class PortShuttleContentDto {
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

export class PortShuttlePriceDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;
  
  @IsString()
  nama: string;

  @Type(() => Number)
  @IsNumber()
  harga: number;
}

export class CreatePortShuttleDto {
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortShuttleContentDto)
  port_shuttle_content?: PortShuttleContentDto[];

  @IsOptional()
  @IsArray()
  port_shuttle_file?: any[];

  @Type(() => PortShuttlePriceDto)
  @ValidateNested({ each: true })
  port_shuttle_price: PortShuttlePriceDto[];
}

export class UpdatePopularStatusDto {
  @Type(() => Number)
  id?: number;

  @IsBoolean()
  is_popular: boolean;
}
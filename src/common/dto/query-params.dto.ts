/* eslint-disable prettier/prettier */
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class QueryParamsDto {
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @Transform(({ value }) => (value === 0 ? 100 : value))
  take?: number = 10;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  orderByMostItems?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  top_attraction?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_rent?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_order?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_active?: boolean;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_admin?: boolean;

  @IsOptional()
  offset?: number;

  @IsOptional()
  tahun?: number;

  is_category?: string;

  @IsOptional()
  @IsNotEmpty()
  store_group_id?: number;

  @IsOptional()
  @IsNotEmpty()
  search?: string;

  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  category_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  negara_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  lokasi_id?: number;

  @IsOptional()
  status?: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.toLowerCase() : undefined))
  item_type?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  negara_ids?: number[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  lokasi_ids?: number[];

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  services?: string[]; // misalnya "WiFi", "Breakfast", dst

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  types?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  harga_min?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  harga_max?: number;
}

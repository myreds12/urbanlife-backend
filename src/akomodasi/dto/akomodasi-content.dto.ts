import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AkomodasiContentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  bahasa?: string = 'INDONESIA';

  @IsString()
  @IsOptional()
  deskripsi?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  kebijakan?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  informasi?: string;
}

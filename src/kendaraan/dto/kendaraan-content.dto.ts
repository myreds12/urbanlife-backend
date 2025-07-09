import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LanguageType } from 'src/common/enum/language-type.enum';

export class KendaraanContentDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @Type(() => Number)
  kendaraan_id?: number;

  @IsEnum(LanguageType)
  bahasa: LanguageType;

  @IsString()
  deskripsi: string;

  @IsOptional()
  @IsString()
  kebijakan?: string;

  @IsOptional()
  @IsString()
  informasi?: string;
}

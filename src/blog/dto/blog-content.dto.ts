import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LanguageType } from 'src/common/enum/language-type.enum';

export class ContentDto {
  @Type(() => Number)
  @IsOptional()
  id?: number;

  @IsEnum(LanguageType)
  bahasa: LanguageType;

  @IsOptional()
  @IsString()
  judul?: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;
}

import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LanguageType } from 'src/common/enum/language-type.enum';

export class NewsContentDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsNotEmpty()
  @IsString()
  judul: string;

  @IsEnum(LanguageType)
  bahasa: LanguageType;

  @IsNotEmpty()
  @IsString()
  deskripsi: string;
}

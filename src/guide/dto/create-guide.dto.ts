import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateGuideDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsEnum(['Male', 'Female'])
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  nomor_hp: string;

  @IsOptional()
  tanggal_periode_berakhir?: string;

  @IsBoolean()
  @IsOptional()
  fluent_english?: boolean;
}

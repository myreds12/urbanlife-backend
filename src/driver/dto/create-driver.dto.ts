import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsEnum(['Male', 'Female'])
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  nomor_hp: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  fluent_english: boolean;

  @IsOptional()
  tanggal_periode_berakhir?: string;
}

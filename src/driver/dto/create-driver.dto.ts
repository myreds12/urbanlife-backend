import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  tanggal_periode_berakhir?: string;
}

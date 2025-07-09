import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsEnum(['Laki - laki', 'Perempuan'])
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  nomor_hp: string;

  @IsOptional()
  tanggal_periode_berakhir?: string;
}

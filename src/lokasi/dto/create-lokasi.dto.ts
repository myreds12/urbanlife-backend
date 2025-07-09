import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLokasiDto {
  @IsString()
  nama: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsInt()
  negara_id: number;
}

import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class KendaraanDurasiDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @Type(() => Number)
  kendaraan_id?: number;

  @IsOptional()
  durasi?: string;

  @IsOptional()
  @Type(() => Number)
  harga?: number;
}

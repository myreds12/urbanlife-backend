import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { VehicleType } from '../enum/vehicle-type.enum';
import { KendaraanContentDto } from './kendaraan-content.dto';
import { ApiProperty } from '@nestjs/swagger';
import { KendaraanDurasiDto } from './kendaraan-durasi.dto';

export class CreateKendaraanDto {
  @ApiProperty({ type: Array<Express.Multer.File>, format: 'array' })
  files: Array<Express.Multer.File>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lokasi_id?: number;

  @IsString()
  nama: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsString()
  model?: string;

  status_pajak: string;

  @IsOptional()
  @IsEnum(VehicleType)
  tipe?: VehicleType;

  @IsOptional()
  @IsDateString()
  tanggal_pajak_berakhir?: string;

  @IsString()
  plat_nomor: string;

  @IsOptional()
  kapasitas?: string;

  @IsOptional()
  harga?: string;

  @Type(() => KendaraanContentDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Kendaraan content must be a non-empty array',
  })
  content?: KendaraanContentDto[];

  @Type(() => KendaraanDurasiDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Kendaraan content must be a non-empty array',
  })
  durasi?: KendaraanDurasiDto[];
}

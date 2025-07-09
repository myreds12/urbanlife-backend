import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../enum/order-status.enum';
import { PemesananItemDto } from './pemesanan-item.dto';
import { OrderType } from '../enum/order-type.enum';

export class CreatePemesananDto {
  nama: string;

  email: string;

  nomor_hp: string;

  deskripsi?: string;

  @IsOptional()
  tanggal_mulai?: string;

  @IsOptional()
  tanggal_selesai?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durasi_jam?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durasi_hari?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_harga?: number;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @Type(() => PemesananItemDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Order item must be a non-empty array',
  })
  order_item: PemesananItemDto[];
}

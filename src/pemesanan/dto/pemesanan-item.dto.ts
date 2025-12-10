import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { OrderType } from '../enum/order-type.enum';
import { Type } from 'class-transformer';

export class PemesananItemDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsBoolean()
  is_priority: boolean;

  @IsInt()
  item_id: number;

  @IsEnum(OrderType)
  item_type: OrderType;

  tanggal_mulai?: string;

  tanggal_selesai?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durasi_hari?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durasi_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  room_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  airport_shuttle_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  port_shuttle_id?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  harga?: number;
}

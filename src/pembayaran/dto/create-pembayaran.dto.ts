import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '../enum/payment-status.enum';

export class CreatePembayaranDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pemesanan_id: number;

  @IsOptional()
  @IsDateString()
  tanggal_bayar?: Date;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  jumlah_bayar: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  metode?: string;
}

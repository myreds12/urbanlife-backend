import { Type } from 'class-transformer';
import { IsDecimal, IsOptional, IsString } from 'class-validator';

export class TravelPackagePricesDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsString()
  description: string;

  @IsDecimal()
  harga: string;
}

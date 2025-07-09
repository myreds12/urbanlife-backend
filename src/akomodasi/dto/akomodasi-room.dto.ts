import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAkomodasiRoomDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @IsString()
  nama: string;

  @Type(() => Number)
  @IsNumber()
  harga: number;
}

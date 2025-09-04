import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNegaraDto {
  @IsNotEmpty()
  nama: string;

  @IsNotEmpty()
  kode: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  status: boolean;
}

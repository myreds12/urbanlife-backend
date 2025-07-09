import { IsInt, IsString } from 'class-validator';

export class CreateKotaDto {
  @IsInt()
  negara_id: number;

  @IsString()
  nama: string;
}

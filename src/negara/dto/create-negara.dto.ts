import { IsNotEmpty } from 'class-validator';

export class CreateNegaraDto {
  @IsNotEmpty()
  nama: string;

  @IsNotEmpty()
  kode: string;
}

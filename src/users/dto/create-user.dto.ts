import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CreateUserDto {
  nama: string;
  email: string;
  nomor_hp: string;
  password: string;

  @Type(() => Number)
  @IsNumber()
  role_id: number;
}

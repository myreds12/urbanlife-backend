/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';

export class RegisterDto {
  nama: string;

  // @MinLength(5)
  nomor_hp: string;

  @Type(() => Number)
  // @IsNumber()
  role_id: number;

  email: string;

  // @MinLength(6)
  password: string;
}

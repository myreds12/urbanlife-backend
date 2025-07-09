/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  nama: string;

  @IsString()
  @MinLength(5)
  nomor_hp: string;

  @IsNumber()
  @Type(() => Number)
  role_id: number;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

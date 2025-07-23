import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAdminWaDto {
  @IsInt()
  @IsNotEmpty()
  role_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nomor_wa: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nama: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  session: string;
}

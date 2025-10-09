import { IsString } from 'class-validator';

export class CreateLogoDto {
  @IsString()
  nama_file: string;

  @IsString()
  url: string;

  @IsString()
  type: string;
}

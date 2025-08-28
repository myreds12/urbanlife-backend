import { IsNotEmpty } from 'class-validator';

export class CreateOurPartnerDto {
  @IsNotEmpty()
  nama: string;
}

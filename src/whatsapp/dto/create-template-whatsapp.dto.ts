import { IsString } from 'class-validator';

export class CreateTemplateWhatsappDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  status: string;

  @IsString()
  text_to_admin: string;

  @IsString()
  text_to_customer: string;
}

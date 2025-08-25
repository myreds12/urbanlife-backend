import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAboutusCtaDto {
  @IsNotEmpty()
  @IsString()
  title_id: string;
  @IsNotEmpty()
  @IsString()
  title_en: string;
  @IsNotEmpty()
  @IsString()
  description_id: string;
  @IsNotEmpty()
  @IsString()
  description_en: string;
  @IsNotEmpty()
  @IsString()
  button_text: string;
  @IsNotEmpty()
  @IsString()
  button_url: string;
}

import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreatePrivacyandpolicyDto {
  @IsString()
  @MaxLength(250)
  title_id: string;

  @IsString()
  @MaxLength(250)
  title_en: string;

  @IsString()
  content_id: string;

  @IsString()
  content_en: string;

  @IsString()
  @MaxLength(250)
  contact_title_id: string;

  @IsString()
  @MaxLength(250)
  contact_title_en: string;

  @IsEmail()
  @MaxLength(250)
  contact_email: string;

  @IsString()
  @MaxLength(250)
  contact_phone: string;

  @IsOptional()
  updatedAt?: Date;
}

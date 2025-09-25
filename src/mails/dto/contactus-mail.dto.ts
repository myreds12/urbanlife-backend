import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class ContactUsDto {
  @IsString()
  @MaxLength(100)
  to: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  inquiryType: string;

  @IsString()
  @MaxLength(100)
  subject: string;

  @IsString()
  @MaxLength(500)
  message: string;
  
}
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNewsCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

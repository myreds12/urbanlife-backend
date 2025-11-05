import { IsNotEmpty } from 'class-validator';

export class CreateTypeAkomodasiDto {
  @IsNotEmpty()
  name: string;
}

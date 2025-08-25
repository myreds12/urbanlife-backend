import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServiceScheduleDto {
  @IsString()
  @IsNotEmpty()
  hari: string;

  @IsString()
  @IsNotEmpty()
  jam_buka: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_special_day: boolean;
}

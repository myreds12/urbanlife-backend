import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePopularStatusDto {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsBoolean()
  is_popular: boolean;
}

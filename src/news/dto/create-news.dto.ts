import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Validate, ValidateNested } from 'class-validator';
import { NewsContentDto } from './news-content.dto';

export class CreateNewsDto {
  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  category_id: number;

  @Type(() => NewsContentDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Kendaraan content must be a non-empty array',
  })
  content?: NewsContentDto[];
}

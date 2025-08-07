import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Validate, ValidateNested } from 'class-validator';
import { ContentDto } from './blog-content.dto';

export class CreateBlogDto {
  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  category_id: number;

  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  lokasi_id: number;

  @IsOptional()
  @IsString()
  slug?: string;

  @Type(() => ContentDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Kendaraan content must be a non-empty array',
  })
  content: ContentDto[];
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Validate, ValidateNested } from 'class-validator';

export class CreateAkomodasiFacilityDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @IsString()
  nama: string;
}

export class CreateAkomodasiFacilityGroupDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @IsString()
  nama: string;

  @Type(() => CreateAkomodasiFacilityDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Akomodasi content must be a non-empty array',
  })
  fasilitas: CreateAkomodasiFacilityDto[];
}

import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidateNested,
} from 'class-validator';
import { AkomodasiType } from '../enum/akomodasi-type.enum';
import { AkomodasiContentDto } from './akomodasi-content.dto';
import { CreateAkomodasiRoomDto } from './akomodasi-room.dto';
import { CreateAkomodasiFacilityGroupDto } from './akomodasi-facility.dto';

export class CreateAkomodasiDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  lokasi_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nama: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  kategori: string;

  @IsEnum(AkomodasiType)
  tipe?: AkomodasiType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  status?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  top_attraction?: boolean;

  @Type(() => AkomodasiContentDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Akomodasi content must be a non-empty array',
  })
  akomodasi_content: AkomodasiContentDto[];

  @Type(() => CreateAkomodasiRoomDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Akomodasi content must be a non-empty array',
  })
  akomodasi_room: CreateAkomodasiRoomDto[];

  @Type(() => CreateAkomodasiFacilityGroupDto)
  @ValidateNested({ each: true })
  @Validate(value => Array.isArray(value) && value.length > 0, {
    message: 'Akomodasi content must be a non-empty array',
  })
  akomodasi_facility: CreateAkomodasiFacilityGroupDto[];

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  type_akomodasi_id: number;
}

import { PartialType } from '@nestjs/swagger';
import { CreateTypeAkomodasiDto } from './create-type-akomodasi.dto';

export class UpdateTypeAkomodasiDto extends PartialType(CreateTypeAkomodasiDto) {}

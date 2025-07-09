import { PartialType } from '@nestjs/swagger';
import { CreateAkomodasiDto } from './create-akomodasi.dto';

export class UpdateAkomodasiDto extends PartialType(CreateAkomodasiDto) {}

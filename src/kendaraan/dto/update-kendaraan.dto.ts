import { PartialType } from '@nestjs/swagger';
import { CreateKendaraanDto } from './create-kendaraan.dto';

export class UpdateKendaraanDto extends PartialType(CreateKendaraanDto) {}

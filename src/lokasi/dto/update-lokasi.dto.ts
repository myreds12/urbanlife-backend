import { PartialType } from '@nestjs/swagger';
import { CreateLokasiDto } from './create-lokasi.dto';

export class UpdateLokasiDto extends PartialType(CreateLokasiDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateNotifikasiWaDto } from './create-notifikasi-wa.dto';

export class UpdateNotifikasiWaDto extends PartialType(CreateNotifikasiWaDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreatePemesananDto } from './create-pemesanan.dto';

export class UpdatePemesananDto extends PartialType(CreatePemesananDto) {}

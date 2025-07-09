import { PartialType } from '@nestjs/swagger';
import { CreateKotaDto } from './create-kota.dto';

export class UpdateKotaDto extends PartialType(CreateKotaDto) {}

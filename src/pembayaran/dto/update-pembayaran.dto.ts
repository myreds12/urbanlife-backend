import { PartialType } from '@nestjs/swagger';
import { CreatePembayaranDto } from './create-pembayaran.dto';

export class UpdatePembayaranDto extends PartialType(CreatePembayaranDto) {}

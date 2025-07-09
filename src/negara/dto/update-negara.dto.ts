import { PartialType } from '@nestjs/swagger';
import { CreateNegaraDto } from './create-negara.dto';

export class UpdateNegaraDto extends PartialType(CreateNegaraDto) {}

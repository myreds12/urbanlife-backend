import { PartialType } from '@nestjs/swagger';
import { CreateAdminWaDto } from './create-admin-wa.dto';

export class UpdateAdminWaDto extends PartialType(CreateAdminWaDto) {}

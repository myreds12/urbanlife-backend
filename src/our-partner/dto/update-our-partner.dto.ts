import { PartialType } from '@nestjs/swagger';
import { CreateOurPartnerDto } from './create-our-partner.dto';

export class UpdateOurPartnerDto extends PartialType(CreateOurPartnerDto) {}

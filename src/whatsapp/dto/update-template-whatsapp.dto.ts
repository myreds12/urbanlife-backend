import { PartialType } from '@nestjs/swagger';
import { CreateTemplateWhatsappDto } from './create-template-whatsapp.dto';

export class UpdateTemplateWhatsappDto extends PartialType(CreateTemplateWhatsappDto) {}

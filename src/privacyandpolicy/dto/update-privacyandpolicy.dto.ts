import { PartialType } from '@nestjs/swagger';
import { CreatePrivacyandpolicyDto } from './create-privacyandpolicy.dto';

export class UpdatePrivacyandpolicyDto extends PartialType(CreatePrivacyandpolicyDto) {}

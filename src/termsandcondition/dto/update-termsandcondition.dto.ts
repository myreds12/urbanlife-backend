import { PartialType } from '@nestjs/swagger';
import { CreateTermsandconditionDto } from './create-termsandcondition.dto';

export class UpdateTermsandconditionDto extends PartialType(CreateTermsandconditionDto) {}

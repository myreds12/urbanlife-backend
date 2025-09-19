import { Module } from '@nestjs/common';
import { TermsandconditionService } from './termsandcondition.service';
import { TermsandconditionController } from './termsandcondition.controller';

@Module({
  controllers: [TermsandconditionController],
  providers: [TermsandconditionService],
})
export class TermsandconditionModule {}

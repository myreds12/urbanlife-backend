import { Module } from '@nestjs/common';
import { PrivacyandpolicyService } from './privacyandpolicy.service';
import { PrivacyandpolicyController } from './privacyandpolicy.controller';

@Module({
  controllers: [PrivacyandpolicyController],
  providers: [PrivacyandpolicyService],
})
export class PrivacyandpolicyModule {}

import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
  controllers: [WhatsappController],
  exports: [WhatsappService],
  providers: [WhatsappService],
})
export class WhatsappModule {}

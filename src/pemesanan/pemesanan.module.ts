import { Module } from '@nestjs/common';
import { PemesananService } from './pemesanan.service';
import { PemesananController } from './pemesanan.controller';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { PemesananCronService } from './pemesanan.cron.service';
import { BullModule } from '@nestjs/bull';
import { OrderProcessor } from './pemesanan-processor.service';
import { MailsModule } from 'src/mails/mails.module';

@Module({
  controllers: [PemesananController],
  providers: [PemesananService, PemesananCronService, OrderProcessor],
  exports: [PemesananService, PemesananCronService],
  imports: [
    WhatsappModule,
    MailsModule,
    BullModule.registerQueue({
      name: 'pemesanan-processing',
    }),
  ],
})
export class PemesananModule {}

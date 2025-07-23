import { Module } from '@nestjs/common';
import { PemesananService } from './pemesanan.service';
import { PemesananController } from './pemesanan.controller';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { PemesananCronService } from './pemesanan.cron.service';

@Module({
  controllers: [PemesananController],
  providers: [PemesananService, PemesananCronService],
  exports: [PemesananService],
  imports: [WhatsappModule],
})
export class PemesananModule {}

import { Module } from '@nestjs/common';
import { NotifikasiWaService } from './notifikasi-wa.service';
import { NotifikasiWaController } from './notifikasi-wa.controller';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [NotifikasiWaController],
  providers: [NotifikasiWaService],
})
export class NotifikasiWaModule {}

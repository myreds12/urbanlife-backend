import { Module } from '@nestjs/common';
import { NotifikasiWaService } from './notifikasi-wa.service';
import { NotifikasiWaController } from './notifikasi-wa.controller';

@Module({
  controllers: [NotifikasiWaController],
  providers: [NotifikasiWaService],
})
export class NotifikasiWaModule {}

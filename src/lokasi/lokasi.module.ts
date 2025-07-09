import { Module } from '@nestjs/common';
import { LokasiService } from './lokasi.service';
import { LokasiController } from './lokasi.controller';

@Module({
  controllers: [LokasiController],
  providers: [LokasiService],
})
export class LokasiModule {}

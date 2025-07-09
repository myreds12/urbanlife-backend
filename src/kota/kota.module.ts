import { Module } from '@nestjs/common';
import { KotaService } from './kota.service';
import { KotaController } from './kota.controller';

@Module({
  controllers: [KotaController],
  providers: [KotaService],
})
export class KotaModule {}

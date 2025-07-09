import { Module } from '@nestjs/common';
import { AdminWaService } from './admin-wa.service';
import { AdminWaController } from './admin-wa.controller';

@Module({
  controllers: [AdminWaController],
  providers: [AdminWaService],
})
export class AdminWaModule {}

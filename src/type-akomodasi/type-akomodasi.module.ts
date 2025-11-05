import { Module } from '@nestjs/common';
import { TypeAkomodasiService } from './type-akomodasi.service';
import { TypeAkomodasiController } from './type-akomodasi.controller';

@Module({
  controllers: [TypeAkomodasiController],
  providers: [TypeAkomodasiService],
})
export class TypeAkomodasiModule {}

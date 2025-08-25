import { Module } from '@nestjs/common';
import { ServiceScheduleService } from './service-schedule.service';
import { ServiceScheduleController } from './service-schedule.controller';

@Module({
  controllers: [ServiceScheduleController],
  providers: [ServiceScheduleService],
})
export class ServiceScheduleModule {}

import { PartialType } from '@nestjs/swagger';
import { CreateServiceScheduleDto } from './create-service-schedule.dto';

export class UpdateServiceScheduleDto extends PartialType(CreateServiceScheduleDto) {}

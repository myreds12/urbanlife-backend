import { PartialType } from '@nestjs/swagger';
import { CreateAirportShuttleDto } from './create-airport-shuttle.dto';

export class UpdateAirportShuttleDto extends PartialType(CreateAirportShuttleDto) {
  keepFilesIds?: number[];
}

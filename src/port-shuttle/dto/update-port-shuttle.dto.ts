import { PartialType } from '@nestjs/swagger';
import { CreatePortShuttleDto } from './create-port-shuttle.dto';

export class UpdatePortShuttleDto extends PartialType(CreatePortShuttleDto) {
  keepFilesIds?: number[];
}

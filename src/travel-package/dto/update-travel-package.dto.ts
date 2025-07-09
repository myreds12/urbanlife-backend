import { PartialType } from '@nestjs/swagger';
import { CreateTravelPackageDto } from './create-travel-package.dto';

export class UpdateTravelPackageDto extends PartialType(CreateTravelPackageDto) {}

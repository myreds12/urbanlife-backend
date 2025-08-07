import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { TravelPackageService } from './travel-package.service';
import { CreateTravelPackageDto } from './dto/create-travel-package.dto';
import { UpdateTravelPackageDto } from './dto/update-travel-package.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('travel-package')
export class TravelPackageController {
  constructor(private readonly travelPackageService: TravelPackageService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createTravelPackageDto: CreateTravelPackageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.travelPackageService.create(createTravelPackageDto, files);
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.travelPackageService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelPackageService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() updateTravelPackageDto: UpdateTravelPackageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.travelPackageService.update(+id, updateTravelPackageDto, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Body('ids') ids: number[]) {
    return this.travelPackageService.remove(ids);
  }
}

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

import { AirportShuttleService } from './airport-shuttle.service';
import { CreateAirportShuttleDto } from './dto/create-airport-shuttle.dto';

import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { UpdateAirportShuttleDto } from './dto/update-airport-shuttle.dto';

@Controller('airport-shuttle')
export class AirportShuttleController {
  constructor(private readonly airportShuttleService: AirportShuttleService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createAirportShuttleDto: CreateAirportShuttleDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.airportShuttleService.create(createAirportShuttleDto, files);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.airportShuttleService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.airportShuttleService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() updateAirportShuttleDto: UpdateAirportShuttleDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.airportShuttleService.update(+id, updateAirportShuttleDto, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  remove(@Body('ids') ids: number[]) {
    return this.airportShuttleService.remove(ids);
  }
}

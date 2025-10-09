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
import { AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { UpdatePopularStatusDto } from './dto/update-popular-status.dto';

@Controller('travel-package')
export class TravelPackageController {
  constructor(private readonly travelPackageService: TravelPackageService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  create(
    @Body() createTravelPackageDto: CreateTravelPackageDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const groupedFiles = {};

    files.forEach(file => {
      const fieldname = file.fieldname;
      
      if (!groupedFiles[fieldname]) {
        groupedFiles[fieldname] = [];
      }
      
      groupedFiles[fieldname].push(file);
    });
  
    return this.travelPackageService.create(createTravelPackageDto, groupedFiles)
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
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @Body() updateTravelPackageDto: UpdateTravelPackageDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const groupedFiles = {};

    files.forEach(file => {
      const fieldname = file.fieldname;
      
      if (!groupedFiles[fieldname]) {
        groupedFiles[fieldname] = [];
      }
      
      groupedFiles[fieldname].push(file);
    });

    return this.travelPackageService.update(+id, updateTravelPackageDto, groupedFiles);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Body('ids') ids: number[]) {
    return this.travelPackageService.remove(ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-popular-status/:id')
  async updatePopularStatus(
    @Param('id') id: string,
    @Body() updatePopularStatusDto: UpdatePopularStatusDto,
  ) {
     const updatedStatus = {
      ...updatePopularStatusDto,
      id: Number(id),
    };
    return this.travelPackageService.updatePopularStatus(updatedStatus);
  }
}

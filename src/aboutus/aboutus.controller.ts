import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { AboutusService } from './aboutus.service';
import { CreateAboutusDto } from './dto/create-aboutus.dto';
import { UpdateAboutusDto } from './dto/update-aboutus.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('aboutus')
export class AboutusController {
  constructor(private readonly aboutusService: AboutusService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createAboutusDto: CreateAboutusDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.aboutusService.create(createAboutusDto, files);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.aboutusService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aboutusService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() updateAboutusDto: UpdateAboutusDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.aboutusService.update(+id, updateAboutusDto, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aboutusService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk-delete')
  async bulkDelete(@Body('ids') ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new Error('No IDs provided for deletion');
    }
    return this.aboutusService.bulkDelete(ids);
  }
}

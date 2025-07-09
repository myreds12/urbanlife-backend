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
import { AkomodasiService } from './akomodasi.service';
import { CreateAkomodasiDto } from './dto/create-akomodasi.dto';
import { UpdateAkomodasiDto } from './dto/update-akomodasi.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@UseGuards(JwtAuthGuard)
@Controller('akomodasi')
export class AkomodasiController {
  constructor(private readonly akomodasiService: AkomodasiService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createAkomodasiDto: CreateAkomodasiDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.akomodasiService.create(createAkomodasiDto, files);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.akomodasiService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.akomodasiService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() updateAkomodasiDto: UpdateAkomodasiDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.akomodasiService.update(+id, updateAkomodasiDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.akomodasiService.remove(+id);
  }
}

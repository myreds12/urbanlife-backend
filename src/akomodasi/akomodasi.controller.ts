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
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('akomodasi')
export class AkomodasiController {
  constructor(private readonly akomodasiService: AkomodasiService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() createAkomodasiDto: CreateAkomodasiDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    console.log(files, 'files');
    // Group files by fieldname (e.g., files, room_temp-a, room_temp-b)
    const groupedFiles = {};
    for (const file of files) {
      if (!groupedFiles[file.fieldname]) {
        groupedFiles[file.fieldname] = [];
      }
      groupedFiles[file.fieldname].push(file);
    }
    return this.akomodasiService.create(createAkomodasiDto, groupedFiles);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.akomodasiService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.akomodasiService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor())
  update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateAkomodasiDto: UpdateAkomodasiDto,
  ) {
    const groupedFiles: { [fieldname: string]: Express.Multer.File[] } = {};
    for (const file of files) {
      if (!groupedFiles[file.fieldname]) {
        groupedFiles[file.fieldname] = [];
      }
      groupedFiles[file.fieldname].push(file);
    }

    return this.akomodasiService.update(+id, updateAkomodasiDto, groupedFiles);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.akomodasiService.remove(+id);
  }
}

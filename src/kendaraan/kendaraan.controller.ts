import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { KendaraanService } from './kendaraan.service';
import { CreateKendaraanDto } from './dto/create-kendaraan.dto';
import { UpdateKendaraanDto } from './dto/update-kendaraan.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@UseGuards(JwtAuthGuard)
@Controller('kendaraan')
export class KendaraanController {
  constructor(private readonly kendaraanService: KendaraanService) {}

  @Get('next-code')
  async nextCode() {
    const code = await this.kendaraanService.getCode();
    let nextCode = 1;
    if (code) nextCode = code.id + 1;

    return { code: nextCode };
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createKendaraanDto: CreateKendaraanDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.kendaraanService.create(createKendaraanDto, files);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.kendaraanService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kendaraanService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() updateKendaraanDto: UpdateKendaraanDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.kendaraanService.update(+id, updateKendaraanDto, files);
  }

  @Delete()
  remove(@Body('ids') ids: number[]) {
    return this.kendaraanService.remove(ids);
  }
}

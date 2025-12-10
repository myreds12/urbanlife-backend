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
import { UpdatePopularStatusDto } from './dto/update-popular-status.dto';

@Controller('kendaraan')
export class KendaraanController {
  constructor(private readonly kendaraanService: KendaraanService) {}

  @UseGuards(JwtAuthGuard)
  @Get('next-code')
  async nextCode() {
    const code = await this.kendaraanService.getCode();
    let nextCode = 1;
    if (code) nextCode = code.id + 1;

    return { code: nextCode };
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() updateKendaraanDto: UpdateKendaraanDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.kendaraanService.update(+id, updateKendaraanDto, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  remove(@Body('ids') ids: number[]) {
    return this.kendaraanService.remove(ids);
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
    return this.kendaraanService.updatePopularStatus(updatedStatus);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-kendaraan/:id')
  deleteKendaraan(@Param('id') id: number) {
    return this.kendaraanService.deleteKendaraan(id);
  }
}

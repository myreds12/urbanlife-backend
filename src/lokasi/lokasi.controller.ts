/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LokasiService } from './lokasi.service';
import { CreateLokasiDto } from './dto/create-lokasi.dto';
import { UpdateLokasiDto } from './dto/update-lokasi.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('lokasi')
export class LokasiController {
  constructor(private readonly lokasiService: LokasiService) {}

  @UseGuards(JwtAuthGuard)
  @Get('next-code')
  async nextCode() {
    const code = await this.lokasiService.getCode();
    let nextCode = 1;
    if (code) nextCode = code.id + 1;

    return { code: nextCode };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createLokasiDto: CreateLokasiDto) {
    return this.lokasiService.create(createLokasiDto);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.lokasiService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lokasiService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLokasiDto: UpdateLokasiDto) {
    return this.lokasiService.update(+id, updateLokasiDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lokasiService.remove(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PemesananService } from './pemesanan.service';
import { CreatePemesananDto } from './dto/create-pemesanan.dto';
import { UpdatePemesananDto } from './dto/update-pemesanan.dto';
import { Request as IExpressRequest } from 'express';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { QueryParamsDto } from 'src/common/dto/query-params.dto';

interface UserRequest extends IExpressRequest {
  user: User;
}

@Controller('pemesanan')
export class PemesananController {
  constructor(private readonly pemesananService: PemesananService) {}

  @Get('/total')
  totalPemsanan() {
    return this.pemesananService.totalPemesanan();
  }

  @Get('/perbulan')
  pemesananPerbulan(@Query() query: QueryParamsDto) {
    return this.pemesananService.pemesananPerBulan(query);
  }

  @Get('/popular-items')
  getPopularPemesananItems(@Query() query: QueryParamsDto) {
    return this.pemesananService.getPopularPemesananItems(query);
  }

  @Get('/items')
  getAllPemesananItems(@Query() query: QueryParamsDto) {
    return this.pemesananService.getAllPemesananItems(query);
  }

  @Post()
  create(@Body() createPemesananDto: CreatePemesananDto) {
    return this.pemesananService.create(createPemesananDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.pemesananService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pemesananService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePemesananDto: UpdatePemesananDto,
    @Req() req: UserRequest,
  ) {
    return this.pemesananService.update(+id, updatePemesananDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pemesananService.remove(+id);
  }
}

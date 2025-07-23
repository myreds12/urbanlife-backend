import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { NotifikasiWaService } from './notifikasi-wa.service';
import { CreateNotifikasiWaDto } from './dto/create-notifikasi-wa.dto';
import { UpdateNotifikasiWaDto } from './dto/update-notifikasi-wa.dto';
import { Request as IExpressRequest } from 'express';
import { User } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

interface UserRequest extends IExpressRequest {
  user: User;
}

@Controller('notifikasi-wa')
export class NotifikasiWaController {
  constructor(private readonly notifikasiWaService: NotifikasiWaService) {}

  @Post()
  create(
    @Body() createNotifikasiWaDto: CreateNotifikasiWaDto,
    @Param() type: string,
    @Req() req: UserRequest,
  ) {
    const request_id = req.user.id;
    return this.notifikasiWaService.create(createNotifikasiWaDto, type, request_id);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.notifikasiWaService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notifikasiWaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotifikasiWaDto: UpdateNotifikasiWaDto) {
    return this.notifikasiWaService.update(+id, updateNotifikasiWaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notifikasiWaService.remove(+id);
  }
}

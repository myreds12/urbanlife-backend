import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotifikasiWaService } from './notifikasi-wa.service';
import { CreateNotifikasiWaDto } from './dto/create-notifikasi-wa.dto';
import { UpdateNotifikasiWaDto } from './dto/update-notifikasi-wa.dto';

@Controller('notifikasi-wa')
export class NotifikasiWaController {
  constructor(private readonly notifikasiWaService: NotifikasiWaService) {}

  @Post()
  create(@Body() createNotifikasiWaDto: CreateNotifikasiWaDto) {
    return this.notifikasiWaService.create(createNotifikasiWaDto);
  }

  @Get()
  findAll() {
    return this.notifikasiWaService.findAll();
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

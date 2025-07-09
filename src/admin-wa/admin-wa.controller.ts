import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdminWaService } from './admin-wa.service';
import { CreateAdminWaDto } from './dto/create-admin-wa.dto';
import { UpdateAdminWaDto } from './dto/update-admin-wa.dto';

@Controller('admin-wa')
export class AdminWaController {
  constructor(private readonly adminWaService: AdminWaService) {}

  @Post()
  create(@Body() createAdminWaDto: CreateAdminWaDto) {
    return this.adminWaService.create(createAdminWaDto);
  }

  @Get()
  findAll() {
    return this.adminWaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminWaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminWaDto: UpdateAdminWaDto) {
    return this.adminWaService.update(+id, updateAdminWaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminWaService.remove(+id);
  }
}

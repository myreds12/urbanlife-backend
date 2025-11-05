import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TypeAkomodasiService } from './type-akomodasi.service';
import { CreateTypeAkomodasiDto } from './dto/create-type-akomodasi.dto';
import { UpdateTypeAkomodasiDto } from './dto/update-type-akomodasi';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('type-akomodasi')
export class TypeAkomodasiController {
  constructor(private readonly typeAkomodasiService: TypeAkomodasiService) {}

  @Post()
  create(@Body() createTypeAkomodasiDto: CreateTypeAkomodasiDto) {
    return this.typeAkomodasiService.create(createTypeAkomodasiDto);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.typeAkomodasiService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeAkomodasiService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypeAkomodasiDto: UpdateTypeAkomodasiDto) {
    return this.typeAkomodasiService.update(+id, updateTypeAkomodasiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeAkomodasiService.remove(+id);
  }
}

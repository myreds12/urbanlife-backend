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
import { KotaService } from './kota.service';
import { CreateKotaDto } from './dto/create-kota.dto';
import { UpdateKotaDto } from './dto/update-kota.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@UseGuards(JwtAuthGuard)
@Controller('kota')
export class KotaController {
  constructor(private readonly kotaService: KotaService) {}

  @Get('next-code')
  async nextCode() {
    const code = await this.kotaService.getCode();
    let nextCode = 1;
    if (code) nextCode = code.id + 1;

    return { code: nextCode };
  }

  @Post()
  create(@Body() createKotaDto: CreateKotaDto) {
    return this.kotaService.create(createKotaDto);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.kotaService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kotaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKotaDto: UpdateKotaDto) {
    return this.kotaService.update(+id, updateKotaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kotaService.remove(+id);
  }
}

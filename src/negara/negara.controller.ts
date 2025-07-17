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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { NegaraService } from './negara.service';
import { CreateNegaraDto } from './dto/create-negara.dto';
import { UpdateNegaraDto } from './dto/update-negara.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('negara')
export class NegaraController {
  constructor(private readonly negaraService: NegaraService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Body() createNegaraDto: CreateNegaraDto, @UploadedFile() file: Express.Multer.File) {
    return this.negaraService.create(createNegaraDto, file);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.negaraService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.negaraService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateNegaraDto: UpdateNegaraDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.negaraService.update(+id, updateNegaraDto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.negaraService.remove(+id);
  }
}

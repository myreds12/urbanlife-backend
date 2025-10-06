import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { LogoService } from './logo.service';
import { CreateLogoDto } from './dto/create-logo.dto';
import { UpdateLogoDto } from './dto/update-logo.dto';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';

@Controller('logo')
export class LogoController {
  constructor(private readonly logoService: LogoService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Body() createLogoDto: CreateLogoDto, @UploadedFile() file: Express.Multer.File) {
    return this.logoService.create(createLogoDto, file);
  }

  @Get()
  findAll() {
    return this.logoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLogoDto: UpdateLogoDto) {
    return this.logoService.update(+id, updateLogoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logoService.remove(+id);
  }
}

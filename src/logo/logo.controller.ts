import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LogoService } from './logo.service';

@Controller('logo')
export class LogoController {
  constructor(private readonly logoService: LogoService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 2))
  async uploadLogo(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    return this.logoService.createOrUpdate(files, body);
  }

  @Get()
  async findAll() {
    return this.logoService.findAll();
  }
}

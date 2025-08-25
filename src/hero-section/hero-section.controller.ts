import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { HeroSectionService } from './hero-section.service';
import { CreateHeroSectionDto } from './dto/create-hero-section.dto';
import { UpdateHeroSectionDto } from './dto/update-hero-section.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('hero-section')
export class HeroSectionController {
  constructor(private readonly heroSectionService: HeroSectionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createHeroSectionDto: CreateHeroSectionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.heroSectionService.create(createHeroSectionDto, file);
  }

  @Get()
  findAll() {
    return this.heroSectionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.heroSectionService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateHeroSectionDto: UpdateHeroSectionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.heroSectionService.update(+id, updateHeroSectionDto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.heroSectionService.remove(+id);
  }
}

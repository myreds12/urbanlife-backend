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
  Query,
} from '@nestjs/common';
import { OurPartnerService } from './our-partner.service';
import { CreateOurPartnerDto } from './dto/create-our-partner.dto';
import { UpdateOurPartnerDto } from './dto/update-our-partner.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('our-partner')
export class OurPartnerController {
  constructor(private readonly ourPartnerService: OurPartnerService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createOurPartnerDto: CreateOurPartnerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ourPartnerService.create(file, createOurPartnerDto);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.ourPartnerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ourPartnerService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateOurPartnerDto: UpdateOurPartnerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ourPartnerService.update(+id, updateOurPartnerDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ourPartnerService.remove(+id);
  }
}

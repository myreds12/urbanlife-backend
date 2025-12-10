import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { PortShuttleService } from './port-shuttle.service';
import { CreatePortShuttleDto, UpdatePopularStatusDto } from './dto/create-port-shuttle.dto';
import { UpdatePortShuttleDto } from './dto/update-port-shuttle.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('port-shuttle')
export class PortShuttleController {
  constructor(private readonly portShuttleService: PortShuttleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() dto: CreatePortShuttleDto, 
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.portShuttleService.create(dto, files);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.portShuttleService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portShuttleService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string, 
    @Body() dto: CreatePortShuttleDto, 
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.portShuttleService.update(+id, dto, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  remove(@Body('ids') ids: number[]) {
    return this.portShuttleService.remove(ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-popular-status/:id')
  async updatePopularStatus(
    @Param('id') id: string,
    @Body() updatePopularStatusDto: UpdatePopularStatusDto,
  ) {
      const updatedStatus = {
      ...updatePopularStatusDto,
      id: Number(id),
    };
    return this.portShuttleService.updatePopularStatus(updatedStatus);
  }
}

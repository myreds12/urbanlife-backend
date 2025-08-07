import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(@Body() createBlogDto: CreateBlogDto, @UploadedFiles() files: Express.Multer.File[]) {
    return this.blogService.create(createBlogDto, files);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.blogService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.blogService.update(+id, updateBlogDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(+id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NewsCategoryService } from './news-category.service';
import { CreateNewsCategoryDto } from './dto/create-news-category.dto';
import { UpdateNewsCategoryDto } from './dto/update-news-category.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('news-category')
export class NewsCategoryController {
  constructor(private readonly newsCategoryService: NewsCategoryService) {}

  @Post()
  create(@Body() createNewsCategoryDto: CreateNewsCategoryDto) {
    return this.newsCategoryService.create(createNewsCategoryDto);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.newsCategoryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsCategoryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNewsCategoryDto: UpdateNewsCategoryDto) {
    return this.newsCategoryService.update(+id, updateNewsCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsCategoryService.remove(+id);
  }
}

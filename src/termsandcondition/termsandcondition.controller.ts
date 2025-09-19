import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TermsandconditionService } from './termsandcondition.service';
import { CreateTermsandconditionDto } from './dto/create-termsandcondition.dto';
import { UpdateTermsandconditionDto } from './dto/update-termsandcondition.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('termsandcondition')
export class TermsandconditionController {
  constructor(private readonly termsandconditionService: TermsandconditionService) {}

  @Post()
  create(@Body() createTermsandconditionDto: CreateTermsandconditionDto) {
    return this.termsandconditionService.create(createTermsandconditionDto);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.termsandconditionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.termsandconditionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTermsandconditionDto: UpdateTermsandconditionDto) {
    return this.termsandconditionService.update(+id, updateTermsandconditionDto);
  }

  @Delete()
  remove(@Body('ids') ids: number[]) {
    return this.termsandconditionService.remove(ids);
  }
}

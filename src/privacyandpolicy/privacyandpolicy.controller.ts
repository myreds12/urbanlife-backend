import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PrivacyandpolicyService } from './privacyandpolicy.service';
import { CreatePrivacyandpolicyDto } from './dto/create-privacyandpolicy.dto';
import { UpdatePrivacyandpolicyDto } from './dto/update-privacyandpolicy.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('privacyandpolicy')
export class PrivacyandpolicyController {
  constructor(private readonly privacyandpolicyService: PrivacyandpolicyService) {}

  @Post()
  create(@Body() createPrivacyandpolicyDto: CreatePrivacyandpolicyDto) {
    return this.privacyandpolicyService.create(createPrivacyandpolicyDto);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.privacyandpolicyService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.privacyandpolicyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePrivacyandpolicyDto: UpdatePrivacyandpolicyDto) {
    return this.privacyandpolicyService.update(+id, updatePrivacyandpolicyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.privacyandpolicyService.remove(+id);
  }
}

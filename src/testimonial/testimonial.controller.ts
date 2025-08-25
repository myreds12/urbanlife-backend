import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TestimonialService } from './testimonial.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Controller('testimonial')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @Post()
  create(@Body() createTestimonialDto: CreateTestimonialDto) {
    return this.testimonialService.create(createTestimonialDto);
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    return this.testimonialService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testimonialService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestimonialDto: UpdateTestimonialDto) {
    return this.testimonialService.update(+id, updateTestimonialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testimonialService.remove(+id);
  }
}

import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const { name } = createCategoryDto;
      const category = await this.prismaService.category.create({
        data: {
          name,
        },
      });
      return category;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take;
      const categories = await this.prismaService.category.findMany({
        skip,
        take,
      });
      return categories;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findOne(id: number) {
    try {
      const category = await this.prismaService.category.findUnique({
        where: { id },
      });
      return category;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      const { name } = updateCategoryDto;
      const category = await this.prismaService.category.update({
        where: { id },
        data: {
          name,
        },
      });
      return category;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async remove(id: number) {
    try {
      const category = await this.prismaService.category.delete({
        where: { id },
      });
      return category;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

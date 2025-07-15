import { Injectable } from '@nestjs/common';
import { CreateNewsCategoryDto } from './dto/create-news-category.dto';
import { UpdateNewsCategoryDto } from './dto/update-news-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class NewsCategoryService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createNewsCategoryDto: CreateNewsCategoryDto) {
    try {
      const newsCategory = await this.prismaService.newsCategory.create({
        data: {
          name: createNewsCategoryDto.name,
        },
      });
      return newsCategory;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;
      const count = await this.prismaService.newsCategory.count();
      const newsCategory = await this.prismaService.newsCategory.findMany({
        skip,
        take: take > 0 ? take : undefined,
        orderBy: { createdAt: 'desc' },
      });
      return {
        data: newsCategory,
        meta: {
          total: count,
          page,
          take,
          takeTotal: newsCategory.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const newsCategory = await this.prismaService.newsCategory.findUnique({
        where: { id },
      });
      return newsCategory;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updateNewsCategoryDto: UpdateNewsCategoryDto) {
    try {
      const newsCategory = await this.prismaService.newsCategory.update({
        where: { id },
        data: {
          name: updateNewsCategoryDto.name,
          updatedAt: new Date(),
        },
      });
      return newsCategory;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const newsCategory = await this.prismaService.newsCategory.delete({
        where: { id },
      });
      return newsCategory;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

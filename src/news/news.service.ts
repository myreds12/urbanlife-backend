import { Injectable } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class NewsService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createNewsDto: CreateNewsDto, files: Express.Multer.File[]) {
    try {
      const { category_id, content } = createNewsDto;
      const newsFiles: Prisma.NewsFileCreateManyNewsInput[] = files.map(file => ({
        nama_file: file.filename,
        url: file.path,
      }));

      const contentData: Prisma.NewsContentCreateManyNewsInput[] = content.map(item => ({
        judul: item.judul,
        bahasa: item.bahasa,
        deskripsi: item.deskripsi,
      }));

      const news = await this.prismaService.news.create({
        data: {
          category_id,
          news_content: {
            createMany: {
              data: contentData,
            },
          },
          news_file: {
            createMany: {
              data: newsFiles,
            },
          },
        },
        include: {
          news_category: {
            select: { id: true, name: true },
          },
          news_file: {
            select: { id: true, nama_file: true, url: true },
          },
          news_content: {
            select: { id: true, judul: true, bahasa: true, deskripsi: true },
          },
        },
      });
      return news;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;
      const count = await this.prismaService.news.count();
      const news = await this.prismaService.news.findMany({
        skip,
        take: take > 0 ? take : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          news_category: {
            select: { id: true, name: true },
          },
          news_file: {
            select: { id: true, nama_file: true, url: true },
          },
          news_content: {
            select: { id: true, judul: true, bahasa: true, deskripsi: true },
          },
        },
      });
      return {
        data: news,
        meta: {
          total: count,
          page,
          take,
          takeTotal: news.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const news = await this.prismaService.news.findUnique({
        where: { id },
        include: {
          news_category: {
            select: { id: true, name: true },
          },
          news_file: {
            select: { id: true, nama_file: true, url: true },
          },
          news_content: {
            select: { id: true, judul: true, bahasa: true, deskripsi: true },
          },
        },
      });
      return news;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updateNewsDto: UpdateNewsDto, files: Express.Multer.File[]) {
    try {
      const { category_id, content } = updateNewsDto;
      const newsFiles: Prisma.NewsFileCreateManyNewsInput[] = files.map(file => ({
        nama_file: file.filename,
        url: file.path,
      }));

      const contentUpserts: Prisma.NewsContentUpsertWithWhereUniqueWithoutNewsInput[] =
        content?.map(item => ({
          where: { id: item.id ?? 0, news_id: id },
          update: {
            deskripsi: item.deskripsi,
            judul: item.judul,
            bahasa: item.bahasa,
          },
          create: {
            deskripsi: item.deskripsi,
            judul: item.judul,
            bahasa: item.bahasa,
          },
        })) ?? [];

      const preservedContentIds = content?.filter(c => c.id).map(c => c.id) ?? [];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, __, news] = await this.prismaService.$transaction([
        this.prismaService.newsContent.deleteMany({
          where: {
            news_id: id,
            ...(preservedContentIds.length && {
              id: { notIn: preservedContentIds },
            }),
          },
        }),
        this.prismaService.newsFile.deleteMany({ where: { news_id: id } }),
        this.prismaService.news.update({
          where: { id },
          data: {
            category_id,
            news_content: {
              upsert: contentUpserts,
            },
            updatedAt: new Date(),
            news_file: {
              createMany: {
                data: newsFiles,
              },
            },
          },
          include: {
            news_category: {
              select: { id: true, name: true },
            },
            news_file: {
              select: { id: true, nama_file: true, url: true },
            },
            news_content: {
              select: { id: true, judul: true, bahasa: true, deskripsi: true },
            },
          },
        }),
      ]);
      return news;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const news = await this.prismaService.news.delete({
        where: { id },
      });
      return news;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

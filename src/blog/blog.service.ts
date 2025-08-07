import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { unlinkSync } from 'fs';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(private readonly prismaService: PrismaService) {}
  private logger = new Logger(BlogService.name);

  async create(createBlogDto: CreateBlogDto, files: Express.Multer.File[]) {
    try {
      const { category_id, lokasi_id, content, slug } = createBlogDto;
      const blogFiles = files.map(file => {
        return {
          nama_file: file.filename,
          url: file.path,
        };
      });

      const blogContent = Array.isArray(content)
        ? content.map(item => ({
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            judul: item?.judul ?? '',
          }))
        : [];
      const blog = await this.prismaService.blog.create({
        data: {
          slug,
          blog_category: {
            connect: { id: category_id },
          },
          lokasi: {
            connect: { id: lokasi_id },
          },
          blog_content: {
            createMany: {
              data: blogContent,
            },
          },
          blog_file: {
            createMany: {
              data: blogFiles,
            },
          },
        },
      });
      return blog;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page, search } = query;
      const count = await this.prismaService.blog.count();
      const where: Prisma.BlogWhereInput = {
        ...(search && {
          OR: [
            {
              blog_content: {
                some: {
                  judul: {
                    contains: search,
                  },
                },
              },
            },
          ],
        }),
      };
      const skip = (page - 1) * take;
      const blogs = await this.prismaService.blog.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          createdAt: true,
          lokasi: {
            select: {
              id: true,
              nama: true,
            },
          },
          blog_category: {
            select: {
              id: true,
              name: true,
            },
          },
          blog_content: {
            select: {
              id: true,
              judul: true,
              deskripsi: true,
              bahasa: true,
            },
          },
          blog_file: {
            select: {
              id: true,
              nama_file: true,
              url: true,
            },
          },
        },
      });
      return {
        data: blogs,
        meta: { page, take, total: count, takeTotal: blogs.length },
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findOne(id: number) {
    try {
      const blog = await this.prismaService.blog.findUnique({
        where: { id },
        include: {
          blog_category: {
            select: { id: true, name: true },
          },
          lokasi: {
            select: { id: true, nama: true },
          },
          blog_content: {
            select: { id: true, judul: true, bahasa: true, deskripsi: true },
          },
          blog_file: {
            select: { id: true, nama_file: true, url: true },
          },
        },
      });
      return blog;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async update(id: number, updateBlogDto: UpdateBlogDto, files: Express.Multer.File[]) {
    try {
      const { category_id, lokasi_id, content, slug } = updateBlogDto;
      if (lokasi_id) {
        const lokasi = await this.prismaService.lokasi.findUnique({
          where: { id: lokasi_id },
          select: { id: true },
        });
        if (!lokasi) {
          throw new NotFoundException(`Lokasi dengan ID ${lokasi_id} tidak ditemukan`);
        }
      }
      const preservedContentIds = content?.filter(c => c.id).map(c => c.id) ?? [];
      const blogFiles = files.map(file => {
        return {
          nama_file: file.filename,
          url: file.path,
        };
      });

      const upsertContent =
        content?.map(item => ({
          where: { id: item.id ?? 0, blog_id: id },
          update: {
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            judul: item?.judul ?? '',
          },
          create: {
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            judul: item?.judul ?? '',
          },
        })) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, __, updatedPackage] = await this.prismaService.$transaction([
        // Hapus semua file sebelumnya
        this.prismaService.blogFile.deleteMany({
          where: { blog_id: id },
        }),

        // Hapus konten yang tidak lagi dipertahankan
        this.prismaService.blogContent.deleteMany({
          where: {
            blog_id: id,
            ...(preservedContentIds.length && {
              id: { notIn: preservedContentIds },
            }),
          },
        }),

        // Update utama TravelPackage
        this.prismaService.blog.update({
          where: { id },
          data: {
            slug,
            blog_category: {
              connect: { id: category_id },
            },
            lokasi: {
              connect: { id: lokasi_id },
            },
            blog_content: {
              upsert: upsertContent,
            },
            blog_file: {
              createMany: {
                data: blogFiles,
              },
            },
          },
        }),
      ]);

      const existingFiles = await this.prismaService.blogFile.findMany({
        where: { blog_id: id },
      });

      existingFiles.forEach(file => {
        if (!blogFiles.find(f => f.url === file.url)) {
          unlinkSync(file.url);
        }
      });
      return updatedPackage;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async remove(id: number) {
    try {
      const blog = await this.prismaService.blog.delete({
        where: { id },
      });
      return blog;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

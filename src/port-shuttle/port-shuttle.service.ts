import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePortShuttleDto, UpdatePopularStatusDto } from './dto/create-port-shuttle.dto';
import { UpdatePortShuttleDto } from './dto/update-port-shuttle.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PortShuttleService {
  constructor(private prisma: PrismaService) { }

  async create(
    dto: CreatePortShuttleDto,
    files: Express.Multer.File[]
  ) {
    try {
      return await this.prisma.portShuttle.create({
        data: {
          lokasi_id: dto.lokasi_id,
          nama: dto.nama,
          top_attraction: dto.top_attraction,
          is_popular: dto.is_popular,

          port_shuttle_content: dto.port_shuttle_content
            ? { create: dto.port_shuttle_content }
            : undefined,

          port_shuttle_file: files.length
            ? {
              create: files.map((file) => ({
                nama_file: file.filename,
                url: file.path,
              })),
            }
            : undefined,
          port_shuttle_price: dto.port_shuttle_price
            ? { create: dto.port_shuttle_price }
            : undefined,
        },

        include: {
          port_shuttle_content: true,
          port_shuttle_file: true,
          lokasi: true,
          port_shuttle_price: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page, search } = query;

      const count = await this.prisma.portShuttle.count();

      const where = search
        ? { OR: [{ nama: { contains: search, mode: 'insensitive' } }] }
        : {};

      const portShuttles = await this.prisma.portShuttle.findMany({
        where,
        skip: page * take - take,
        take: take > 0 ? take : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
              negara: { select: { id: true, nama: true } },
            },
          },
          port_shuttle_content: true,
          port_shuttle_file: true,
          port_shuttle_price: true,
        },
      });

      return {
        data: portShuttles,
        meta: { page, take, total: count, takeTotal: portShuttles.length },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number) {
    try {
      const data = await this.prisma.portShuttle.findUnique({
        where: { id },
        include: {
          port_shuttle_content: true,
          port_shuttle_file: true,
          lokasi: true,
          port_shuttle_price: true,
        },
      });

      if (!data) throw new NotFoundException('Port shuttle not found');

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(
    id: number,
    dto: UpdatePortShuttleDto,
    files: Express.Multer.File[]
  ) {
    try {
      const existing = await this.prisma.portShuttle.findUnique({
        where: { id },
        include: { port_shuttle_file: true, port_shuttle_content: true, port_shuttle_price: true },
      });

      if (!existing) throw new NotFoundException('Data not found');

      const keepFilesIds = dto.keepFilesIds || [];
      const filesToDelete = existing.port_shuttle_file.filter(
        (file) => !keepFilesIds.includes(file.id),
      );

      for (const file of filesToDelete) {
        const filePath = path.join(
          process.cwd(),
          'uploads/port-shuttle',
          file.nama_file,
        );
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      if (filesToDelete.length > 0) {
        await this.prisma.portShuttleFile.deleteMany({
          where: { id: { in: filesToDelete.map((f) => f.id) } },
        });
      }

      if (dto.port_shuttle_content) {
        for (const content of dto.port_shuttle_content) {
          const existingContent = await this.prisma.portShuttleContent.findFirst({
            where: {
              port_shuttle_id: id,
              bahasa: content.bahasa,
            },
          });

          if (existingContent) {
            await this.prisma.portShuttleContent.update({
              where: { id: existingContent.id },
              data: {
                deskripsi: content.deskripsi,
                kebijakan: content.kebijakan,
              },
            });
          } else {
            await this.prisma.portShuttleContent.create({
              data: {
                port_shuttle_id: id,
                bahasa: content.bahasa,
                deskripsi: content.deskripsi,
                kebijakan: content.kebijakan,
              },
            });
          }
        }
      }

      if (dto.port_shuttle_price) {
        for (const price of dto.port_shuttle_price) {
          const existingPrice = await this.prisma.portShuttlePrice.findFirst({
            where: {
              id: price.id,
            },
          });

          if (existingPrice) {
            await this.prisma.portShuttlePrice.update({
              where: { id: existingPrice.id },
              data: {
                nama: price.nama,
                harga: price.harga,
              },
            });
          } else {
            await this.prisma.portShuttlePrice.create({
              data: {
                port_shuttle_id: id,
                nama: price.nama,
                harga: price.harga,
              },
            });
          }
        }
      }

      const fileCreateData = files.length
        ? files.map((file) => ({
          nama_file: file.filename,
          url: file.path,
        }))
        : [];

      return await this.prisma.portShuttle.update({
        where: { id },
        data: {
          lokasi_id: dto.lokasi_id,
          nama: dto.nama,
          top_attraction: dto.top_attraction,
          is_popular: dto.is_popular,

          port_shuttle_file: fileCreateData.length
            ? { create: fileCreateData }
            : undefined,
        },

        include: {
          port_shuttle_content: true,
          port_shuttle_file: true,
          lokasi: true,
          port_shuttle_price: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(ids: number[]) {
    try {
      return await this.prisma.portShuttle.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException(error.message);
    }
  }

  async updatePopularStatus(updatePopularStatusDto: UpdatePopularStatusDto) {
    const { id, is_popular } = updatePopularStatusDto;

    const portShuttle = await this.prisma.portShuttle.findUnique({
      where: { id },
    });

    if (!portShuttle) {
      throw new NotFoundException('Airport shuttle not found');
    }

    return this.prisma.portShuttle.update({
      where: { id },
      data: { is_popular },
    });
  }
}

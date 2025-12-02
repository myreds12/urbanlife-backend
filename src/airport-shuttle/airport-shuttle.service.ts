import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAirportShuttleDto } from './dto/create-airport-shuttle.dto';
import { UpdateAirportShuttleDto } from './dto/update-airport-shuttle.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AirportShuttleService {
  constructor(private prisma: PrismaService) { }

  async create(
    dto: CreateAirportShuttleDto,
    files: Express.Multer.File[]
  ) {
    try {
      return await this.prisma.airportShuttle.create({
        data: {
          lokasi_id: dto.lokasi_id,
          nama: dto.nama,
          harga: dto.harga,
          top_attraction: dto.top_attraction,
          is_popular: dto.is_popular,
          airport_shuttle_content: dto.airport_shuttle_content
            ? { create: dto.airport_shuttle_content }
            : undefined,
          airport_shuttle_file: files.length
            ? {
              create: files.map((file) => ({
                nama_file: file.filename,
                url: file.path,
              })),
            }
            : undefined,
        },
        include: {
          airport_shuttle_content: true,
          airport_shuttle_file: true,
          lokasi: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page, search } = query;
      const count = await this.prisma.airportShuttle.count();

      const where = {
        ...(search && {
          OR: [
            {
              nama: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      };

      const airportShuttles = await this.prisma.airportShuttle.findMany({
        where,
        skip: page * take - take,
        take: take > 0 ? take : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
              negara: {
                select: {
                  id: true,
                  nama: true,
                },
              },
            },
          },
          airport_shuttle_content: {
            select: {
              id: true,
              bahasa: true,
              deskripsi: true,
              kebijakan: true,
            },
          },
          airport_shuttle_file: {
            select: {
              id: true,
              nama_file: true,
              url: true,
            },
          },
        },
      });

      return {
        data: airportShuttles,
        meta: {
          page,
          take,
          total: count,
          takeTotal: airportShuttles.length,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number) {
    try {
      const data = await this.prisma.airportShuttle.findUnique({
        where: { id },
        include: {
          airport_shuttle_content: true,
          airport_shuttle_file: true,
          lokasi: true,
        },
      });

      if (!data) throw new NotFoundException('Airport shuttle not found');
      return data;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(error.message);
    }
  }

  async update(
    id: number,
    dto: UpdateAirportShuttleDto,
    files: Express.Multer.File[]
  ) {
    try {
      const existing = await this.prisma.airportShuttle.findUnique({
        where: { id },
        include: { airport_shuttle_file: true, airport_shuttle_content: true },
      });

      if (!existing) throw new NotFoundException('Data not found');

      const keepFilesIds = dto.keepFilesIds || [];
      const filesToDelete = existing.airport_shuttle_file.filter(
        (file) => !keepFilesIds.includes(file.id),
      );

      for (const file of filesToDelete) {
        const filePath = path.join(
          process.cwd(),
          'uploads/airport-shuttle',
          file.nama_file,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      if (filesToDelete.length > 0) {
        await this.prisma.airportShuttleFile.deleteMany({
          where: { id: { in: filesToDelete.map((f) => f.id) } },
        });
      }

      if (dto.airport_shuttle_content) {
        for (const content of dto.airport_shuttle_content) {
          const existingContent = await this.prisma.airportShuttleContent.findFirst({
            where: {
              airport_shuttle_id: id,
              bahasa: content.bahasa,
            },
          });

          if (existingContent) {
            await this.prisma.airportShuttleContent.update({
              where: { id: existingContent.id },
              data: {
                deskripsi: content.deskripsi,
                kebijakan: content.kebijakan,
              },
            });
          } else {
            await this.prisma.airportShuttleContent.create({
              data: {
                airport_shuttle_id: id,
                bahasa: content.bahasa,
                deskripsi: content.deskripsi,
                kebijakan: content.kebijakan,
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

      return await this.prisma.airportShuttle.update({
        where: { id },
        data: {
          lokasi_id: dto.lokasi_id,
          nama: dto.nama,
          harga: dto.harga,
          top_attraction: dto.top_attraction,
          is_popular: dto.is_popular,
          airport_shuttle_file: fileCreateData.length
            ? { create: fileCreateData }
            : undefined,
        },
        include: {
          airport_shuttle_content: true,
          airport_shuttle_file: true,
          lokasi: true,
        },
      });
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(error.message);
    }
  }

  async remove(ids: number[]) {
    try {
      return await this.prisma.airportShuttle.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

}

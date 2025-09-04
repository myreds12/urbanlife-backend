/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { CreateLokasiDto } from './dto/create-lokasi.dto';
import { UpdateLokasiDto } from './dto/update-lokasi.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class LokasiService {
  constructor(private readonly prismaService: PrismaService) {}
  async create({ nama, alamat, negara_id }: CreateLokasiDto) {
    return this.prismaService.lokasi.create({
      data: { nama, alamat, negara: { connect: { id: negara_id } } }, // Assuming default country ID is 1
    });
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page, negara_id, is_active } = query;
      const skip = page * take - take;
      const count = await this.prismaService.lokasi.count();
      const lokasi = await this.prismaService.lokasi.findMany({
        where: {
          ...(negara_id && { negara_id }),
          ...(is_active && { status: is_active }),
        },
        skip,
        take: take > 0 ? take : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          negara: {
            select: {
              id: true,
              nama: true,
            },
          },
        },
      });
      return {
        data: lokasi,
        meta: {
          total: count,
          page,
          take,
          takeTotal: lokasi.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const lokasi = await this.prismaService.lokasi.findUnique({
        where: { id },
      });
      return lokasi;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, { nama, alamat, status }: UpdateLokasiDto) {
    return this.prismaService.lokasi.update({
      where: { id },
      data: { nama, alamat, status },
    });
  }

  async remove(id: number) {
    try {
      const lokasi = await this.prismaService.lokasi.delete({
        where: { id },
      });
      return lokasi;
    } catch (error) {
      throw error;
    }
  }

  async getCode() {
    try {
      const kota = await this.prismaService.lokasi.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 1,
      });

      return kota[0] || null;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}

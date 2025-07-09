import { Injectable } from '@nestjs/common';
import { CreateKotaDto } from './dto/create-kota.dto';
import { UpdateKotaDto } from './dto/update-kota.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class KotaService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createKotaDto: CreateKotaDto) {
    try {
      const kota = await this.prismaService.kota.create({
        data: {
          nama: createKotaDto.nama,
          negara: {
            connect: {
              id: createKotaDto.negara_id,
            },
          },
        },
      });
      return kota;
    } catch (error) {
      throw error;
    }
  }

  async findAll(Query: QueryParamsDto) {
    try {
      const { take, page } = Query;
      const skip = page * take - take;
      const count = await this.prismaService.kota.count();
      const kota = await this.prismaService.kota.findMany({
        skip,
        take: take > 0 ? take : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          negara: true,
        },
      });
      return {
        data: kota,
        meta: {
          total: count,
          page,
          take,
          takeTotal: kota.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const kota = await this.prismaService.kota.findUnique({
        where: { id },
        include: {
          negara: true,
        },
      });
      if (!kota) {
        throw new Error(`Kota with id ${id} not found`);
      }
      return kota;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updateKotaDto: UpdateKotaDto) {
    try {
      const kota = await this.prismaService.kota.update({
        where: { id },
        data: {
          nama: updateKotaDto.nama,
          ...(updateKotaDto.negara_id && {
            negara: {
              connect: {
                id: updateKotaDto.negara_id,
              },
            },
          }),
        },
      });
      return kota;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const kota = await this.prismaService.kota.update({
        where: { id },
        data: {
          status: false,
        },
      });
      return kota;
    } catch (error) {
      throw error;
    }
  }

  async getCode() {
    try {
      const kota = await this.prismaService.kota.findMany({
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

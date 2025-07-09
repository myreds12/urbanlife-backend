import { Injectable } from '@nestjs/common';
import { CreateNegaraDto } from './dto/create-negara.dto';
import { UpdateNegaraDto } from './dto/update-negara.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class NegaraService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createNegaraDto: CreateNegaraDto, file: Express.Multer.File) {
    try {
      if (!file) {
        throw new Error('File is required');
      }

      const negara = await this.prismaService.negara.create({
        data: {
          nama: createNegaraDto.nama,
          kode: createNegaraDto.kode,
          url: file.path,
          nama_file: file.filename,
        },
      });
      return negara;
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;
      const count = await this.prismaService.lokasi.count();
      const negara = await this.prismaService.negara.findMany({
        skip,
        take: take > 0 ? take : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      });
      return {
        data: negara,
        meta: {
          total: count,
          page,
          take,
          takeTotal: negara.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const negara = await this.prismaService.negara.findUnique({
        where: { id },
      });
      return negara;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateNegaraDto: UpdateNegaraDto, file: Express.Multer.File) {
    try {
      const negara = await this.prismaService.negara.update({
        where: { id },
        data: {
          nama: updateNegaraDto.nama,
          kode: updateNegaraDto.kode,
          url: file ? file.path : undefined,
          nama_file: file ? file.filename : undefined,
        },
      });
      return negara;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const negara = await this.prismaService.negara.update({
        where: { id },
        data: {
          status: false,
        },
      });
      return negara;
    } catch (error) {
      throw error;
    }
  }
}

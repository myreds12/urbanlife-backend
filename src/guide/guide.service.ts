import { Injectable } from '@nestjs/common';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GuideService {
  constructor(private prismaService: PrismaService) {}
  async create(createGuideDto: CreateGuideDto) {
    try {
      const { nama, gender, nomor_hp, tanggal_periode_berakhir, fluent_english } = createGuideDto;
      const guide = await this.prismaService.guide.create({
        data: {
          nama,
          gender,
          nomor_hp,
          tanggal_periode_berakhir: tanggal_periode_berakhir
            ? new Date(tanggal_periode_berakhir)
            : null,
          fluent_english,
        },
      });
      return guide;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take;
      const guides = await this.prismaService.guide.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
      return guides;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const guide = await this.prismaService.guide.findUnique({
        where: { id },
      });
      return guide;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updateGuideDto: UpdateGuideDto) {
    try {
      const { nama, gender, nomor_hp, tanggal_periode_berakhir, fluent_english } = updateGuideDto;
      const guide = await this.prismaService.guide.update({
        where: { id },
        data: {
          nama,
          gender,
          nomor_hp,
          tanggal_periode_berakhir: tanggal_periode_berakhir
            ? new Date(tanggal_periode_berakhir)
            : undefined,
          fluent_english,
        },
      });
      return guide;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const guide = await this.prismaService.guide.delete({
        where: { id },
      });
      return guide;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getCode() {
    try {
      const guide = await this.prismaService.guide.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 1,
      });

      return guide[0] || null;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}

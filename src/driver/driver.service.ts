import { Injectable } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class DriverService {
  constructor(private prismaService: PrismaService) {}
  async create(createGuideDto: CreateDriverDto) {
    try {
      const { nama, gender, nomor_hp, tanggal_periode_berakhir, fluent_english } = createGuideDto;
      const driver = await this.prismaService.driver.create({
        data: {
          nama,
          gender,
          nomor_hp,
          fluent_english,
          tanggal_periode_berakhir: tanggal_periode_berakhir
            ? new Date(tanggal_periode_berakhir)
            : null,
        },
      });
      return driver;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take;
      const driver = await this.prismaService.driver.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
      return driver;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const driver = await this.prismaService.driver.findUnique({
        where: { id },
      });
      return driver;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updateGuideDto: UpdateDriverDto) {
    try {
      const { nama, gender, nomor_hp, tanggal_periode_berakhir, fluent_english } = updateGuideDto;
      const driver = await this.prismaService.driver.update({
        where: { id },
        data: {
          nama,
          gender,
          nomor_hp,
          fluent_english,
          tanggal_periode_berakhir: tanggal_periode_berakhir
            ? new Date(tanggal_periode_berakhir)
            : undefined,
        },
      });
      return driver;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const driver = await this.prismaService.driver.delete({
        where: { id },
      });
      return driver;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getCode() {
    try {
      const driver = await this.prismaService.driver.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 1,
      });

      return driver[0] || null;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}

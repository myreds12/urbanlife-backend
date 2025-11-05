import { Injectable } from '@nestjs/common';
import { CreateTypeAkomodasiDto } from './dto/create-type-akomodasi.dto';
import { UpdateTypeAkomodasiDto } from './dto/update-type-akomodasi';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class TypeAkomodasiService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createTypeAkomodasiDto: CreateTypeAkomodasiDto) {
    try {
      const { name } = createTypeAkomodasiDto;
      const typeAkomodasi = await this.prismaService.typeAkomodasi.create({
        data: {
          name,
        },
      });
      return typeAkomodasi;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take;
      const categories = await this.prismaService.typeAkomodasi.findMany({
        skip,
        take,
      });
      return categories;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async findOne(id: number) {
    try {
      const typeAkomodasi = await this.prismaService.typeAkomodasi.findUnique({
        where: { id },
      });
      return typeAkomodasi;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async update(id: number, updateTypeAkomodasiDto: UpdateTypeAkomodasiDto) {
    try {
      const { name } = updateTypeAkomodasiDto;
      const typeAkomodasi = await this.prismaService.typeAkomodasi.update({
        where: { id },
        data: {
          name,
        },
      });
      return typeAkomodasi;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async remove(id: number) {
    try {
      const typeAkomodasi = await this.prismaService.typeAkomodasi.delete({
        where: { id },
      });
      return typeAkomodasi;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

import { Injectable } from '@nestjs/common';
import { CreateOurPartnerDto } from './dto/create-our-partner.dto';
import { UpdateOurPartnerDto } from './dto/update-our-partner.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { unlinkSync } from 'fs';

@Injectable()
export class OurPartnerService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(file: Express.Multer.File, createOurPartnerDto: CreateOurPartnerDto) {
    try {
      return await this.prismaService.ourPartner.create({
        data: {
          nama: createOurPartnerDto.nama,
          url: file.path,
          nama_file: file.filename,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take;
      const ourPartner = await this.prismaService.ourPartner.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
      return ourPartner;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      return await this.prismaService.ourPartner.findUnique({ where: { id } });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updateOurPartnerDto: UpdateOurPartnerDto, file?: Express.Multer.File) {
    try {
      return await this.prismaService.ourPartner.update({
        where: { id },
        data: {
          nama: updateOurPartnerDto.nama,
          url: file ? file.path : undefined,
          nama_file: file ? file.filename : undefined,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      //Menghapus file secara lokal jika ada
      const ourPartner = await this.prismaService.ourPartner.findUnique({ where: { id } });
      if (ourPartner.url) {
        unlinkSync(ourPartner.url);
      }
      return await this.prismaService.ourPartner.delete({ where: { id } });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

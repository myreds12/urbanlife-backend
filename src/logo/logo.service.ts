import { Injectable } from '@nestjs/common';
import { CreateLogoDto } from './dto/create-logo.dto';
import { UpdateLogoDto } from './dto/update-logo.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LogoService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createLogoDto: CreateLogoDto, file: Express.Multer.File) {
    try {
      if (!file) {
        throw new Error('File is required');
      }
      const logo = await this.prismaService.logo.create({
        data: {
          nama_file: file.filename,
          url: file.path,
        },
      });
      return logo;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const logos = await this.prismaService.logo.findMany();
      return logos;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const logo = await this.prismaService.logo.findUnique({
        where: { id },
      });
      return logo;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateLogoDto: UpdateLogoDto, file?: Express.Multer.File) {
    try {
      const data: any = { ...updateLogoDto };
      if (file) {
        data.nama_file = file.originalname;
        data.url = file.path;
      }
      const logo = await this.prismaService.logo.update({
        where: { id },
        data,
      });
      return logo;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const logo = await this.prismaService.logo.delete({
        where: { id },
      });
      return logo;
    } catch (error) {
      throw error;
    }
  }
}

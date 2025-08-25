import { Injectable } from '@nestjs/common';
import { CreateHeroSectionDto } from './dto/create-hero-section.dto';
import { UpdateHeroSectionDto } from './dto/update-hero-section.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { unlinkSync } from 'fs';

@Injectable()
export class HeroSectionService {
  constructor(
    private readonly prismaService: PrismaService, // Assuming you have a PrismaService for database operations
  ) {}
  async create(createHeroSectionDto: CreateHeroSectionDto, file: Express.Multer.File) {
    try {
      const { title, status } = createHeroSectionDto;

      const heroSection = await this.prismaService.heroSection.create({
        data: {
          title,
          status,
          nama_file: file.filename,
          url: file.path,
        },
      });
      return heroSection;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prismaService.heroSection.findMany();
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      return await this.prismaService.heroSection.findUnique({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateHeroSectionDto: UpdateHeroSectionDto, file: Express.Multer.File) {
    try {
      const { title, status } = updateHeroSectionDto;

      const existingHeroSection = await this.prismaService.heroSection.findUnique({
        where: { id },
      });

      if (!existingHeroSection) {
        throw new Error('HeroSection not found');
      }

      // Hapus file lama jika ada file baru yang diunggah
      if (file && existingHeroSection.nama_file) {
        try {
          unlinkSync(existingHeroSection.url);
        } catch (err) {
          console.error('Error deleting old file:', err);
        }
      }

      const heroSection = await this.prismaService.heroSection.update({
        where: { id },
        data: {
          title,
          status,
          nama_file: file ? file.filename : existingHeroSection.nama_file,
          url: file ? file.path : existingHeroSection.url,
        },
      });
      return heroSection;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // Hapus file terkait sebelum menghapus entri database
      const existingHeroSection = await this.prismaService.heroSection.findUnique({
        where: { id },
      });
      if (existingHeroSection && existingHeroSection.nama_file) {
        try {
          unlinkSync(existingHeroSection.url);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      const heroSection = await this.prismaService.heroSection.delete({
        where: { id },
      });
      return heroSection;
    } catch (error) {
      throw error;
    }
  }
}

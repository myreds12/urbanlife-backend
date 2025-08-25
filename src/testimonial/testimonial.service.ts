import { Injectable } from '@nestjs/common';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class TestimonialService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTestimonialDto: CreateTestimonialDto) {
    try {
      const testimonial = await this.prisma.testimonial.create({
        data: {
          pemesanan: {
            connect: { id: createTestimonialDto.pemesanan_id },
          },
          nama: createTestimonialDto.nama,
          pekerjaan: createTestimonialDto.pekerjaan,
          deskripsi: createTestimonialDto.deskripsi,
        },
      });
      return testimonial;
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take || 0;
      const [data, total] = await this.prisma.$transaction([
        this.prisma.testimonial.findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.testimonial.count(),
      ]);
      return {
        data,
        meta: {
          total,
          page,
          take,
          takeTotal: data.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const testimonial = await this.prisma.testimonial.findUnique({
        where: { id },
      });
      return testimonial;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateTestimonialDto: UpdateTestimonialDto) {
    try {
      const testimonial = await this.prisma.testimonial.update({
        where: { id },
        data: {
          ...updateTestimonialDto,
        },
      });
      return testimonial;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const testimonial = await this.prisma.testimonial.delete({
        where: { id },
      });
      return testimonial;
    } catch (error) {
      throw error;
    }
  }
}

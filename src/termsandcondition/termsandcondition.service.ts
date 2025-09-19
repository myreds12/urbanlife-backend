import { Injectable } from '@nestjs/common';
import { CreateTermsandconditionDto } from './dto/create-termsandcondition.dto';
import { UpdateTermsandconditionDto } from './dto/update-termsandcondition.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class TermsandconditionService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createTermsandconditionDto: CreateTermsandconditionDto) {
    try {
      const termsandcondition = await this.prismaService.termsAndCondition.create({
        data: {
          title_id: createTermsandconditionDto.title_id,
          title_en: createTermsandconditionDto.title_en,
          content_id: createTermsandconditionDto.content_id,
          content_en: createTermsandconditionDto.content_en,
        },
      });
      return termsandcondition;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take || 0;
      const [data, total] = await this.prismaService.$transaction([
        this.prismaService.termsAndCondition.findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        this.prismaService.termsAndCondition.count(),
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

  findOne(id: number) {
    return `This action returns a #${id} termsandcondition`;
  }

  async update(id: number, updateTermsandconditionDto: UpdateTermsandconditionDto) {
    try {
      const termsandcondition = await this.prismaService.termsAndCondition.update({
        where: { id },
        data: {
          title_id: updateTermsandconditionDto.title_id,
          title_en: updateTermsandconditionDto.title_en,
          content_id: updateTermsandconditionDto.content_id,
          content_en: updateTermsandconditionDto.content_en,
          is_active: updateTermsandconditionDto.is_active,
          updatedAt: new Date(),
        },
      });
      return termsandcondition;
    } catch (error) {
      throw error;
    }
  }

  async remove(ids: number[]) {
    try {
      const termsandcondition = await this.prismaService.termsAndCondition.deleteMany({
        where: { id: { in: ids } },
      });
      return termsandcondition;
    } catch (error) {
      throw error;
    }
  }
}

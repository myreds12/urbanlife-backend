import { Injectable } from '@nestjs/common';
import { CreatePrivacyandpolicyDto } from './dto/create-privacyandpolicy.dto';
import { UpdatePrivacyandpolicyDto } from './dto/update-privacyandpolicy.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class PrivacyandpolicyService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPrivacyandpolicyDto: CreatePrivacyandpolicyDto) {
    try {
      const {
        title_id,
        title_en,
        content_id,
        content_en,
        contact_title_id,
        contact_title_en,
        contact_email,
        contact_phone,
      } = createPrivacyandpolicyDto;

      const privacyandpolicy = await this.prismaService.privacyAndPolicy.create({
        data: {
          title_id,
          title_en,
          content_id,
          content_en,
          contact_title_id,
          contact_title_en,
          contact_email,
          contact_phone,
        },
      });

      return privacyandpolicy;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;
      const count = await this.prismaService.privacyAndPolicy.count();
      const privacyandpolicy = await this.prismaService.privacyAndPolicy.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
      return {
        data: privacyandpolicy,
        meta: {
          total: count,
          page,
          take,
          takeTotal: privacyandpolicy.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const privacyandpolicy = await this.prismaService.privacyAndPolicy.findUnique({
        where: { id },
      });
      return privacyandpolicy;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(id: number, updatePrivacyandpolicyDto: UpdatePrivacyandpolicyDto) {
    try {
      const {
        title_id,
        title_en,
        content_id,
        content_en,
        contact_title_id,
        contact_title_en,
        contact_email,
        contact_phone,
      } = updatePrivacyandpolicyDto;

      const privacyandpolicy = await this.prismaService.privacyAndPolicy.update({
        where: { id },
        data: {
          title_id,
          title_en,
          content_id,
          content_en,
          contact_title_id,
          contact_title_en,
          contact_email,
          contact_phone,
        },
      });

      return privacyandpolicy;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const privacyandpolicy = await this.prismaService.privacyAndPolicy.delete({
        where: { id },
      });
      return privacyandpolicy;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

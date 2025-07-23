import { Injectable } from '@nestjs/common';
import { CreateNotifikasiWaDto } from './dto/create-notifikasi-wa.dto';
import { UpdateNotifikasiWaDto } from './dto/update-notifikasi-wa.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class NotifikasiWaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}
  async create(createNotifikasiWaDto: CreateNotifikasiWaDto, type: string, user_id: number) {
    try {
      console.log(type, 'createNotifikasiWaDto', createNotifikasiWaDto, 'user_id', user_id);
    } catch (error) {}
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;
      const notifikasi = await this.prismaService.notfikasiWa.findMany({
        skip,
        take: take > 0 ? take : undefined,
        include: {
          pemesanan: {
            select: {
              id: true,
              total_harga: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return notifikasi;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const notifikasi = await this.prismaService.notfikasiWa.findUnique({
        where: { id },
        include: {
          pemesanan: {
            select: {
              id: true,
              total_harga: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });
      return notifikasi;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  update(id: number, updateNotifikasiWaDto: UpdateNotifikasiWaDto) {
    return `This action updates a #${id} notifikasiWa`;
  }

  remove(id: number) {
    return `This action removes a #${id} notifikasiWa`;
  }
}

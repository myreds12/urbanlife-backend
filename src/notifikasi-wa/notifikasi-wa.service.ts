import { Injectable } from '@nestjs/common';
import { CreateNotifikasiWaDto } from './dto/create-notifikasi-wa.dto';
import { UpdateNotifikasiWaDto } from './dto/update-notifikasi-wa.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';

@Injectable()
export class NotifikasiWaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}
  async create(createNotifikasiWaDto: CreateNotifikasiWaDto, type: string, user_id: number) {
    try {
      const sendMessage = await this.whatsappService.sendMessage(
        createNotifikasiWaDto.to,
        createNotifikasiWaDto.message,
        user_id.toString(),
      );

      console.log(sendMessage, 'Send Message');

      if (!sendMessage) return;

      return await this.prismaService.notfikasiWa.create({
        data: {
          nomor_wa: createNotifikasiWaDto.to,
          waktu_kirim: new Date(),
          pesan: createNotifikasiWaDto.message,
          pemesanan_id: createNotifikasiWaDto.pemesanan_id,
        },
      });
    } catch (error) {}
  }

  findAll() {
    return `This action returns all notifikasiWa`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notifikasiWa`;
  }

  update(id: number, updateNotifikasiWaDto: UpdateNotifikasiWaDto) {
    return `This action updates a #${id} notifikasiWa`;
  }

  remove(id: number) {
    return `This action removes a #${id} notifikasiWa`;
  }
}

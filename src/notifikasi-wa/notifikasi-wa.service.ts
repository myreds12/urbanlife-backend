import { Injectable } from '@nestjs/common';
import { CreateNotifikasiWaDto } from './dto/create-notifikasi-wa.dto';
import { UpdateNotifikasiWaDto } from './dto/update-notifikasi-wa.dto';

@Injectable()
export class NotifikasiWaService {
  create(createNotifikasiWaDto: CreateNotifikasiWaDto) {
    return 'This action adds a new notifikasiWa';
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

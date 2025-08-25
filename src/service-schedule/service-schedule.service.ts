import { Injectable } from '@nestjs/common';
import { CreateServiceScheduleDto } from './dto/create-service-schedule.dto';
import { UpdateServiceScheduleDto } from './dto/update-service-schedule.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceScheduleService {
  constructor(
    private readonly prismaService: PrismaService, // Assuming you have a PrismaService for database operations
  ) {}
  async create(createServiceScheduleDto: CreateServiceScheduleDto) {
    try {
      const { hari, is_special_day, jam_buka } = createServiceScheduleDto;
      const serviceSchedule = await this.prismaService.serviceSchedule.create({
        data: {
          hari,
          is_special_day: is_special_day ?? false,
          jam_buka,
        },
      });
      return serviceSchedule;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    return await this.prismaService.serviceSchedule.findMany();
  }

  async findOne(id: number) {
    return await this.prismaService.serviceSchedule.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateServiceScheduleDto: UpdateServiceScheduleDto) {
    try {
      const { hari, is_special_day, jam_buka } = updateServiceScheduleDto;
      const serviceSchedule = await this.prismaService.serviceSchedule.update({
        where: { id },
        data: {
          hari,
          is_special_day,
          jam_buka,
        },
      });
      return serviceSchedule;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const serviceSchedule = await this.prismaService.serviceSchedule.delete({
        where: { id },
      });
      return serviceSchedule;
    } catch (error) {
      throw error;
    }
  }
}

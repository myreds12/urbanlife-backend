import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminWaDto } from './dto/create-admin-wa.dto';
import { UpdateAdminWaDto } from './dto/update-admin-wa.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminWaService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createAdminWaDto: CreateAdminWaDto) {
    try {
      // Validasi role_id
      const role = await this.prismaService.roles.findUnique({
        where: { id: createAdminWaDto.role_id },
        select: { id: true },
      });
      if (!role) {
        throw new NotFoundException(`Role dengan ID ${createAdminWaDto.role_id} tidak ditemukan`);
      }

      const adminWa = await this.prismaService.adminWa.create({
        data: {
          user: {
            connect: { id: 1 }, // Ganti dengan ID user yang sesuai
          },
          role: { connect: { id: createAdminWaDto.role_id } },
          nomor_wa: createAdminWaDto.nomor_wa,
          nama: createAdminWaDto.nama,
          session: createAdminWaDto.session,
        },
      });
      return adminWa;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const adminWas = await this.prismaService.adminWa.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
      });
      return adminWas;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const adminWa = await this.prismaService.adminWa.findUnique({
        where: { id },
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
      });
      if (!adminWa) {
        throw new NotFoundException(`Admin WA dengan ID ${id} tidak ditemukan`);
      }
      return adminWa;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateAdminWaDto: UpdateAdminWaDto) {
    try {
      // Validasi role_id jika ada
      if (updateAdminWaDto.role_id) {
        const role = await this.prismaService.roles.findUnique({
          where: { id: updateAdminWaDto.role_id },
          select: { id: true },
        });
        if (!role) {
          throw new NotFoundException(`Role dengan ID ${updateAdminWaDto.role_id} tidak ditemukan`);
        }
      }

      const adminWa = await this.prismaService.adminWa.update({
        where: { id },
        data: {
          ...(updateAdminWaDto.role_id && { role: { connect: { id: updateAdminWaDto.role_id } } }),
          ...(updateAdminWaDto.nomor_wa && { nomor_wa: updateAdminWaDto.nomor_wa }),
          ...(updateAdminWaDto.nama && { nama: updateAdminWaDto.nama }),
          ...(updateAdminWaDto.session && { session: updateAdminWaDto.session }),
        },
      });
      return adminWa;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const adminWa = await this.prismaService.adminWa.findUnique({
        where: { id },
      });

      if (!adminWa) {
        throw new NotFoundException(`Admin WA dengan ID ${id} tidak ditemukan`);
      }

      await this.prismaService.adminWa.delete({
        where: { id },
      });

      return adminWa;
    } catch (error) {
      throw error;
    }
  }
}

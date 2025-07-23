import { Injectable } from '@nestjs/common';
import { CreateNegaraDto } from './dto/create-negara.dto';
import { UpdateNegaraDto } from './dto/update-negara.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class NegaraService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createNegaraDto: CreateNegaraDto, file: Express.Multer.File) {
    try {
      if (!file) {
        throw new Error('File is required');
      }

      const negara = await this.prismaService.negara.create({
        data: {
          nama: createNegaraDto.nama,
          kode: createNegaraDto.kode,
          url: file.path,
          nama_file: file.filename,
        },
      });
      return negara;
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;

      // Ambil total negara
      const totalNegara = await this.prismaService.negara.count();

      // Ambil data negara
      const negaraList = await this.prismaService.negara.findMany({
        skip,
        take: take > 0 ? take : undefined,
        orderBy: { createdAt: 'desc' },
      });

      const negaraIds = negaraList.map(n => n.id);

      // === Ambil total lokasi per negara ===
      const lokasi = await this.prismaService.lokasi.findMany({
        where: { negara_id: { in: negaraIds } },
        select: { id: true, negara_id: true },
      });

      const lokasiByNegara = lokasi.reduce(
        (acc, curr) => {
          acc[curr.negara_id] = (acc[curr.negara_id] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      // === Ambil kendaraan dan map berdasarkan negara_id ===
      const kendaraan = await this.prismaService.kendaraan.findMany({
        where: { lokasi: { negara_id: { in: negaraIds } } },
        select: { id: true, lokasi: { select: { negara_id: true } } },
      });

      const kendaraanByNegara = kendaraan.reduce(
        (acc, curr) => {
          const negaraId = curr.lokasi?.negara_id;
          if (negaraId) {
            acc[negaraId] = (acc[negaraId] || 0) + 1;
          }
          return acc;
        },
        {} as Record<number, number>,
      );

      // === Ambil akomodasi ===
      const akomodasi = await this.prismaService.akomodasi.findMany({
        where: { lokasi: { negara_id: { in: negaraIds } } },
        select: { id: true, lokasi: { select: { negara_id: true } } },
      });

      const akomodasiByNegara = akomodasi.reduce(
        (acc, curr) => {
          const negaraId = curr.lokasi?.negara_id;
          if (negaraId) {
            acc[negaraId] = (acc[negaraId] || 0) + 1;
          }
          return acc;
        },
        {} as Record<number, number>,
      );

      // === Ambil travel package ===
      const travelPackages = await this.prismaService.travelPackage.findMany({
        where: { lokasi: { negara_id: { in: negaraIds } } },
        select: { id: true, lokasi: { select: { negara_id: true } } },
      });

      const travelByNegara = travelPackages.reduce(
        (acc, curr) => {
          const negaraId = curr.lokasi?.negara_id;
          if (negaraId) {
            acc[negaraId] = (acc[negaraId] || 0) + 1;
          }
          return acc;
        },
        {} as Record<number, number>,
      );

      // === Gabungkan semua ke dalam response ===
      const dataWithCounts = negaraList.map(n => ({
        ...n,
        total_lokasi: lokasiByNegara[n.id] || 0,
        total_kendaraan: kendaraanByNegara[n.id] || 0,
        total_akomodasi: akomodasiByNegara[n.id] || 0,
        total_travel_package: travelByNegara[n.id] || 0,
      }));

      return {
        data: dataWithCounts,
        meta: {
          total: totalNegara,
          page,
          take,
          takeTotal: dataWithCounts.length,
        },
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const negara = await this.prismaService.negara.findUnique({
        where: { id },
      });
      return negara;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateNegaraDto: UpdateNegaraDto, file: Express.Multer.File) {
    try {
      const negara = await this.prismaService.negara.update({
        where: { id },
        data: {
          nama: updateNegaraDto.nama,
          kode: updateNegaraDto.kode,
          url: file ? file.path : undefined,
          nama_file: file ? file.filename : undefined,
        },
      });
      return negara;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const negara = await this.prismaService.negara.update({
        where: { id },
        data: {
          status: false,
        },
      });
      return negara;
    } catch (error) {
      throw error;
    }
  }
}

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
      const { take, page, orderByMostItems } = query;
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

      // Ambil total lokasi per negara
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

      // Ambil kendaraan per negara
      const kendaraan = await this.prismaService.kendaraan.findMany({
        where: { lokasi: { negara_id: { in: negaraIds } } },
        select: { id: true, lokasi: { select: { id: true, negara_id: true } } },
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

      // Ambil akomodasi per negara
      const akomodasi = await this.prismaService.akomodasi.findMany({
        where: { lokasi: { negara_id: { in: negaraIds } } },
        select: { id: true, lokasi: { select: { id: true, negara_id: true } } },
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

      // Ambil travel package per negara
      const travelPackages = await this.prismaService.travelPackage.findMany({
        where: { lokasi: { negara_id: { in: negaraIds } } },
        select: { id: true, lokasi: { select: { id: true, negara_id: true } } },
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

      // --- Hitung total_customer per negara ---

      // Buat map item_id per negara untuk tiap tipe item
      const kendaraanIdsByNegara = kendaraan.reduce(
        (acc, curr) => {
          const negaraId = curr.lokasi?.negara_id;
          if (negaraId) {
            if (!acc[negaraId]) acc[negaraId] = new Set<number>();
            acc[negaraId].add(curr.id);
          }
          return acc;
        },
        {} as Record<number, Set<number>>,
      );

      // Ambil akomodasiRoomAndPrice dengan lokasi negara_id
      const akomodasiRoomAndPrice = await this.prismaService.akomodasiRoomAndPrice.findMany({
        where: {
          akomodasi: {
            lokasi: { negara_id: { in: negaraIds } },
          },
        },
        select: {
          id: true,
          akomodasi: {
            select: {
              lokasi: {
                select: { id: true, negara_id: true },
              },
            },
          },
        },
      });

      const akomodasiRoomIdsByNegara = akomodasiRoomAndPrice.reduce(
        (acc, curr) => {
          const negaraId = curr.akomodasi.lokasi.negara_id;
          if (negaraId) {
            if (!acc[negaraId]) acc[negaraId] = new Set<number>();
            acc[negaraId].add(curr.id);
          }
          return acc;
        },
        {} as Record<number, Set<number>>,
      );

      const travelPackageIdsByNegara = travelPackages.reduce(
        (acc, curr) => {
          const negaraId = curr.lokasi?.negara_id;
          if (negaraId) {
            if (!acc[negaraId]) acc[negaraId] = new Set<number>();
            acc[negaraId].add(curr.id);
          }
          return acc;
        },
        {} as Record<number, Set<number>>,
      );

      // Ambil semua pemesanan item yang item_id dan item_type sesuai
      const pemesananItems = await this.prismaService.pemesananItem.findMany({
        where: {
          OR: [
            { item_type: 'KENDARAAN', item_id: { in: kendaraan.map(k => k.id) } },
            { item_type: 'AKOMODASI_ROOM', item_id: { in: akomodasiRoomAndPrice.map(a => a.id) } },
            { item_type: 'TRAVEL_PACKAGE', item_id: { in: travelPackages.map(t => t.id) } },
          ],
        },
        select: {
          pemesanan_id: true,
          item_type: true,
          item_id: true,
        },
      });

      // Map pemesanan_id ke negara_id berdasarkan item_type dan item_id
      const pemesananIdToNegaraIds = new Map<number, Set<number>>();

      pemesananItems.forEach(item => {
        let negaraId: number | undefined;

        if (item.item_type === 'KENDARAAN') {
          for (const [nid, idSet] of Object.entries(kendaraanIdsByNegara)) {
            if (idSet.has(item.item_id)) {
              negaraId = Number(nid);
              break;
            }
          }
        } else if (item.item_type === 'AKOMODASI_ROOM') {
          for (const [nid, idSet] of Object.entries(akomodasiRoomIdsByNegara)) {
            if (idSet.has(item.item_id)) {
              negaraId = Number(nid);
              break;
            }
          }
        } else if (item.item_type === 'TRAVEL_PACKAGE') {
          for (const [nid, idSet] of Object.entries(travelPackageIdsByNegara)) {
            if (idSet.has(item.item_id)) {
              negaraId = Number(nid);
              break;
            }
          }
        }

        if (negaraId !== undefined) {
          if (!pemesananIdToNegaraIds.has(item.pemesanan_id)) {
            pemesananIdToNegaraIds.set(item.pemesanan_id, new Set());
          }
          pemesananIdToNegaraIds.get(item.pemesanan_id)!.add(negaraId);
        }
      });

      // Ambil pemesanan dengan user_id
      const pemesananIds = Array.from(pemesananIdToNegaraIds.keys());
      const pemesananList = await this.prismaService.pemesanan.findMany({
        where: { id: { in: pemesananIds } },
        select: { id: true, user_id: true },
      });

      // Map user_id per negara
      const negaraToUserIds = new Map<number, Set<number>>();

      pemesananList.forEach(pemesanan => {
        const negaraIdsSet = pemesananIdToNegaraIds.get(pemesanan.id);
        if (negaraIdsSet) {
          negaraIdsSet.forEach(negaraId => {
            if (!negaraToUserIds.has(negaraId)) {
              negaraToUserIds.set(negaraId, new Set());
            }
            negaraToUserIds.get(negaraId)!.add(pemesanan.user_id);
          });
        }
      });

      // Hitung total_customer per negara
      const customerByNegara: Record<number, number> = {};
      negaraToUserIds.forEach((userSet, negaraId) => {
        customerByNegara[negaraId] = userSet.size;
      });

      // Gabungkan semua data ke response
      const dataWithCounts = negaraList.map(n => {
        const total_kendaraan = kendaraanByNegara[n.id] || 0;
        const total_akomodasi = akomodasiByNegara[n.id] || 0;
        const total_travel_package = travelByNegara[n.id] || 0;
        const total_customer = customerByNegara[n.id] || 0;

        return {
          ...n,
          total_lokasi: lokasiByNegara[n.id] || 0,
          total_kendaraan,
          total_akomodasi,
          total_travel_package,
          total_customer,
          total_all_items: total_kendaraan + total_akomodasi + total_travel_package,
        };
      });

      if (orderByMostItems) {
        dataWithCounts.sort((a, b) => b.total_all_items - a.total_all_items);
      }

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
          status: updateNegaraDto.status,
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
      const negara = await this.prismaService.negara.delete({
        where: { id },
      });
      return negara;
    } catch (error) {
      throw error;
    }
  }
}

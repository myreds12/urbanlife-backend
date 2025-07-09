import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePemesananDto } from './dto/create-pemesanan.dto';
import { UpdatePemesananDto } from './dto/update-pemesanan.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PemesananService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createPemesananDto: CreatePemesananDto) {
    try {
      const { status, total_harga, nama, email, nomor_hp, deskripsi, order_item, type } =
        createPemesananDto;

      const role = await this.prismaService.roles.findFirst({
        where: { name: 'User' },
        select: { id: true },
      });
      if (!role) {
        throw new NotFoundException('Role "User" tidak ditemukan');
      }

      const user = await this.prismaService.user.create({
        data: {
          nama,
          email,
          nomor_hp,
          password: await bcrypt.hash(`${nama}-${nomor_hp}`, 10), // Use a default password or handle it as needed
          role: {
            connect: { id: role.id }, // Assuming role with ID 1 is the default user role
          },
        },
      });

      const orderItem: Prisma.PemesananItemCreateManyPemesananInput[] = order_item?.map(item => ({
        item_id: item.item_id,
        is_priority: item.is_priority,
        item_type: item.item_type,
        ...(item.durasi_id && { durasi_id: item.durasi_id }),
        ...(item.room_id && { room_id: item.room_id }),
        durasi_hari: item.durasi_hari,
        total_harga: item.harga,
        tanggal_mulai: item.tanggal_mulai ? new Date(item.tanggal_mulai) : undefined,
        tanggal_selesai: item.tanggal_selesai ? new Date(item.tanggal_selesai) : undefined,
      }));
      console.log(orderItem, 'item');

      const pemesanan = await this.prismaService.pemesanan.create({
        data: {
          type,
          status,
          deskripsi,
          total_harga,
          user: {
            connect: { id: user.id },
          },
          pemesanan_item: {
            createMany: {
              data: orderItem,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
              nomor_hp: true,
            },
          },
        },
      });
      return pemesanan;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    const { take = 10, page = 1, status } = query;
    const skip = (page - 1) * take;

    try {
      console.time('START TIME');
      const where: Prisma.PemesananWhereInput = status ? { status } : {};

      const [total, pemesananList] = await Promise.all([
        this.prismaService.pemesanan.count({ where }),
        this.prismaService.pemesanan.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, nama: true, email: true, nomor_hp: true },
            },
            pemesanan_item: {
              include: {
                durasi: {
                  select: {
                    id: true,
                    durasi: true,
                    harga: true,
                  },
                },
                room: {
                  select: {
                    id: true,
                    nama: true,
                    harga: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const itemMap = this.extractItemIdsByType(pemesananList);
      console.log(itemMap);
      const detailMap = await this.fetchItemDetails(itemMap);

      const data = pemesananList.map(p => ({
        ...p,
        pemesanan_item: p.pemesanan_item.map(item => ({
          ...item,
          detail: detailMap[item.item_type]?.get(item.item_id) || null,
        })),
      }));
      console.timeEnd('START TIME');

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

  // Helper: Pisahkan item_id berdasarkan tipe
  private extractItemIdsByType(pemesananList: any[]) {
    const map = {
      KENDARAAN: new Set<number>(),
      AKOMODASI: new Set<number>(),
      TRAVEL_PACKAGE: new Set<number>(),
    };

    console.log(pemesananList, 'pemesananList');

    for (const p of pemesananList) {
      for (const item of p.pemesanan_item) {
        if (item.item_type in map) {
          map[item.item_type].add(item.item_id);
        }
      }
    }

    return {
      kendaraanIds: Array.from(map.KENDARAAN),
      akomodasiIds: Array.from(map.AKOMODASI),
      travelPackageIds: Array.from(map.TRAVEL_PACKAGE),
    };
  }

  // Helper: Ambil data relasi lalu kembalikan dalam Map
  private async fetchItemDetails({
    kendaraanIds,
    akomodasiIds,
    travelPackageIds,
  }: {
    kendaraanIds: number[];
    akomodasiIds: number[];
    travelPackageIds: number[];
  }) {
    const [kendaraan, akomodasi, travelPackage] = await Promise.all([
      this.prismaService.kendaraan.findMany({ where: { id: { in: kendaraanIds } } }),
      this.prismaService.akomodasi.findMany({ where: { id: { in: akomodasiIds } } }),
      this.prismaService.travelPackage.findMany({ where: { id: { in: travelPackageIds } } }),
    ]);

    console.log(kendaraan);
    console.log(new Map(kendaraan.map(k => [k.id, k])));

    return {
      KENDARAAN: new Map(kendaraan.map(k => [k.id, k])),
      AKOMODASI: new Map(akomodasi.map(a => [a.id, a])),
      TRAVEL_PACKAGE: new Map(travelPackage.map(t => [t.id, t])),
    };
  }

  async findOne(id: number) {
    try {
      const pemesanan = await this.prismaService.pemesanan.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
              nomor_hp: true,
            },
          },
          pemesanan_item: true,
        },
      });

      if (!pemesanan) throw new NotFoundException(`Pemesanan ID ${id} tidak ditemukan`);

      // Ekstrak ID berdasarkan tipe
      const itemMap = this.extractItemIdsByType([pemesanan]);

      // Ambil data detail berdasarkan tipe
      const detailMap = await this.fetchItemDetails(itemMap);

      // Tambahkan detail ke setiap item
      const items = pemesanan.pemesanan_item.map(item => ({
        ...item,
        detail: detailMap[item.item_type]?.get(item.item_id) || null,
      }));

      return {
        ...pemesanan,
        pemesanan_item: items,
      };
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updatePemesananDto: UpdatePemesananDto, user: User) {
    try {
      const { status, total_harga, type, order_item } = updatePemesananDto;
      const { id: user_id } = user;

      const orderItem: Prisma.PemesananItemCreateManyPemesananInput[] = order_item
        ? order_item.map(item => ({
            item_id: item.item_id,
            is_priority: item.is_priority,
            item_type: item.item_type,
            ...(item.durasi_id && { durasi_id: item.durasi_id }),
            ...(item.room_id && { room_id: item.room_id }),
            durasi_hari: item.durasi_hari,
            total_harga: item.harga,
            tanggal_mulai: item.tanggal_mulai ? new Date(item.tanggal_mulai) : undefined,
            tanggal_selesai: item.tanggal_selesai ? new Date(item.tanggal_selesai) : undefined,
          }))
        : [];
      const pemesanan = await this.prismaService.pemesanan.update({
        where: { id },
        data: {
          status,
          type,
          total_harga,
          updatedAt: new Date(),
          ...(order_item
            ? {
                pemesanan_item: {
                  createMany: {
                    data: orderItem,
                  },
                },
              }
            : undefined),
          user: {
            connect: { id: user_id },
          },
        },
      });
      return pemesanan;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const pemesanan = await this.prismaService.pemesanan.delete({
        where: { id },
      });
      return pemesanan;
    } catch (error) {
      throw error;
    }
  }

  async getAllPemesananItems(query: QueryParamsDto) {
    const { take, page, is_category } = query;

    const skip = (Number(page) - 1) * Number(take);

    // Ambil total count untuk pagination
    const [kendaraanTotal, akomodasiTotal, travelPackageTotal] = await Promise.all([
      this.prismaService.kendaraan.count({ where: { status: true } }),
      this.prismaService.akomodasi.count({ where: { status: true } }),
      this.prismaService.travelPackage.count({}),
    ]);

    const [kendaraan, akomodasi, travelPackage] = await Promise.all([
      this.prismaService.kendaraan.findMany({
        where: { status: true },
        skip,
        take: Number(take),
        select: {
          id: true,
          nama: true,
          harga: true,
          tipe: true,
          model: true,
          kapasitas: true,
          status: true,
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
              negara: {
                select: {
                  id: true,
                  nama: true,
                  kode: true,
                },
              },
            },
          },
          kendaraan_content: {
            select: {
              id: true,
              deskripsi: true,
              bahasa: true,
            },
          },
          kendaraan_file: {
            select: {
              id: true,
              nama_file: true,
              url: true,
            },
          },
          kendaraan_durasi: {
            select: {
              id: true,
              durasi: true,
              harga: true,
            },
          },
        },
      }),
      this.prismaService.akomodasi.findMany({
        where: { status: true },
        skip,
        take: Number(take),
        select: {
          id: true,
          nama: true,
          kategori: true,
          harga: true,
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
              negara: {
                select: {
                  id: true,
                  nama: true,
                  kode: true,
                },
              },
            },
          },
          akomodasi_room_and_price: {
            select: {
              id: true,
              nama: true,
              harga: true,
            },
          },
          akomodasi_facility_group: {
            select: {
              id: true,
              nama: true,
              fasilitas: {
                select: { id: true, nama: true, facility_group_id: true },
              },
            },
          },
          akomodasi_content: {
            select: {
              id: true,
              deskripsi: true,
              bahasa: true,
              informasi: true,
              kebijakan: true,
            },
          },
          akomodasi_file: {
            select: {
              id: true,
              nama_file: true,
              url: true,
            },
          },
        },
      }),
      this.prismaService.travelPackage.findMany({
        skip,
        take: Number(take),
        select: {
          id: true,
          nama: true,
          harga_anak: true,
          harga_dewasa: true,
          durasi: true,
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
              negara: {
                select: {
                  id: true,
                  nama: true,
                  kode: true,
                },
              },
            },
          },
          travel_package_content: {
            select: {
              id: true,
              deskripsi: true,
              bahasa: true,
              informasi: true,
              kebijakan: true,
            },
          },
          travel_package_itinerary: {
            select: {
              id: true,
              deskripsi: true,
              bahasa: true,
              nama: true,
            },
          },
          travelPackageFile: {
            select: {
              id: true,
              nama_file: true,
              url: true,
            },
          },
        },
      }),
    ]);

    const kendaraanItems = kendaraan.map(k => ({
      id: k.id,
      nama: k.nama,
      harga: Number(k.harga),
      tipe: k.tipe,
      item_type: 'KENDARAAN',
      model: k.model,
      kapasitas: k.kapasitas,
      status: k.status,
      content: k.kendaraan_content,
      file_name: k?.kendaraan_file[0]?.nama_file ?? '',
      file_url: k?.kendaraan_file[0]?.url ?? '',
      lokasi: k.lokasi,
      durasi: k.kendaraan_durasi,
    }));

    const akomodasiItems = akomodasi.map(a => ({
      id: a.id,
      nama: a.nama,
      harga: 500000, // bisa ambil dari relasi jika ada
      kategori: a.kategori,
      item_type: 'AKOMODASI',
      content: a.akomodasi_content,
      file_name: a?.akomodasi_file[0]?.nama_file ?? '',
      file_url: a?.akomodasi_file[0]?.url ?? '',
      lokasi: a.lokasi,
      room_and_price: a.akomodasi_room_and_price,
      facility_group: a.akomodasi_facility_group,
    }));

    const travelPackageItems = travelPackage.map(t => ({
      id: t.id,
      nama: t.nama,
      harga_anak: Number(t.harga_anak),
      harga_dewasa: Number(t.harga_dewasa),
      durasi_hari: t.durasi,
      item_type: 'TRAVEL_PACKAGE',
      content: t.travel_package_content,
      itinerary: t.travel_package_itinerary,
      file_name: t?.travelPackageFile[0]?.nama_file ?? '',
      file_url: t?.travelPackageFile[0]?.url ?? '',
      lokasi: t.lokasi,
    }));

    if (is_category === 'true') {
      return {
        kendaraan: kendaraanItems,
        akomodasi: akomodasiItems,
        travel_package: travelPackageItems,
        kendaraan_total: kendaraanTotal,
        akomodasi_total: akomodasiTotal,
        travel_package_total: travelPackageTotal,
        page: Number(page),
        take: Number(take),
      };
    }

    const merged = [...kendaraanItems, ...akomodasiItems, ...travelPackageItems];

    return {
      data: merged,
      meta: {
        total: kendaraanTotal + akomodasiTotal + travelPackageTotal,
        page: Number(page),
        take: Number(take),
        take_total: merged.length,
      },
    };
  }
}

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
    const { status, total_harga, nama, email, nomor_hp, deskripsi, order_item, type } =
      createPemesananDto;

    const userRole = await this.prismaService.roles.findFirst({
      where: { name: 'User' },
      select: { id: true },
    });

    if (!userRole) {
      throw new NotFoundException('Role "User" tidak ditemukan');
    }

    const defaultPassword = await bcrypt.hash(`${nama}-${nomor_hp}`, 10);

    const createdUser = await this.prismaService.user.create({
      data: {
        nama,
        email,
        nomor_hp,
        password: defaultPassword,
        role: {
          connect: { id: userRole.id },
        },
      },
    });

    const formattedItems: Prisma.PemesananItemCreateManyPemesananInput[] =
      order_item?.map(item => ({
        item_id: item.item_id,
        is_priority: item.is_priority,
        item_type: item.item_type,
        durasi_id: item.durasi_id || undefined,
        room_id: item.room_id || undefined,
        durasi_hari: item.durasi_hari,
        total_harga: item.harga,
        tanggal_mulai: item.tanggal_mulai ? new Date(item.tanggal_mulai) : undefined,
        tanggal_selesai: item.tanggal_selesai ? new Date(item.tanggal_selesai) : undefined,
      })) ?? [];

    const pemesanan = await this.prismaService.pemesanan.create({
      data: {
        type,
        status,
        deskripsi,
        total_harga,
        user: {
          connect: { id: createdUser.id },
        },
        pemesanan_item: {
          createMany: {
            data: formattedItems,
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
  }

  async findAll(query: QueryParamsDto) {
    const { take = 10, page = 1, status } = query;
    const skip = (page - 1) * take;

    try {
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
      const detailMap = await this.fetchItemDetails(itemMap);

      const data = pemesananList.map(p => ({
        ...p,
        pemesanan_item: p.pemesanan_item.map(item => ({
          ...item,
          detail: detailMap[item.item_type]?.get(item.item_id) || null,
        })),
      }));

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

  private extractItemIdsByType(pemesananList: any[]) {
    const map = {
      KENDARAAN: new Set<number>(),
      AKOMODASI: new Set<number>(),
      TRAVEL_PACKAGE: new Set<number>(),
    };

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

      const itemMap = this.extractItemIdsByType([pemesanan]);

      const detailMap = await this.fetchItemDetails(itemMap);

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
      const pemesanan = await this.prismaService.$transaction([
        this.prismaService.pemesananItem.deleteMany({ where: { pemesanan_id: id } }),
        this.prismaService.pemesanan.delete({
          where: { id },
        }),
      ]);
      return pemesanan;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getAllPemesananItems(query: QueryParamsDto) {
    const {
      take = 10,
      page = 1,
      is_category,
      date_from,
      date_to,
      negara_id,
      lokasi_id,
      type,
    } = query;

    const skip = (Number(page) - 1) * Number(take);

    const bookedMap = new Map<'KENDARAAN' | 'AKOMODASI' | 'TRAVEL_PACKAGE', number[]>();

    if (date_from && date_to) {
      const bookedItems = await this.prismaService.pemesananItem.findMany({
        where: {
          tanggal_mulai: { lte: new Date(date_to) },
          tanggal_selesai: { gte: new Date(date_from) },
        },
        select: { item_id: true, item_type: true },
      });

      bookedItems.forEach(({ item_type, item_id }) => {
        const key = item_type as 'KENDARAAN' | 'AKOMODASI' | 'TRAVEL_PACKAGE';
        if (!bookedMap.has(key)) bookedMap.set(key, []);
        bookedMap.get(key)?.push(item_id);
      });
    }

    const buildLokasiFilter = () => {
      if (!negara_id && !lokasi_id) return undefined;
      return {
        lokasi: {
          ...(negara_id ? { negara_id: Number(negara_id) } : {}),
          ...(lokasi_id ? { id: Number(lokasi_id) } : {}),
        },
      };
    };

    const fetchKendaraan = !type || type === 'KENDARAAN';
    const fetchAkomodasi = !type || type === 'AKOMODASI';
    const fetchTravel = !type || type === 'TRAVEL_PACKAGE';

    const [
      kendaraan,
      akomodasi,
      travelPackage,
      kendaraanTotal,
      akomodasiTotal,
      travelPackageTotal,
    ] = await Promise.all([
      fetchKendaraan
        ? this.prismaService.kendaraan.findMany({
            where: {
              status: true,
              ...(bookedMap.has('KENDARAAN') ? { id: { notIn: bookedMap.get('KENDARAAN')! } } : {}),
              ...buildLokasiFilter(),
            },
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
                    select: { id: true, nama: true, kode: true },
                  },
                },
              },
              kendaraan_file: { select: { id: true, nama_file: true, url: true } },
              kendaraan_durasi: { select: { id: true, durasi: true, harga: true } },
            },
          })
        : [],
      fetchAkomodasi
        ? this.prismaService.akomodasi.findMany({
            where: {
              status: true,
              ...(bookedMap.has('AKOMODASI') ? { id: { notIn: bookedMap.get('AKOMODASI')! } } : {}),
              ...buildLokasiFilter(),
            },
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
                    select: { id: true, nama: true, kode: true },
                  },
                },
              },
              akomodasi_room_and_price: {
                select: { id: true, nama: true, harga: true },
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
              akomodasi_file: { select: { id: true, nama_file: true, url: true } },
            },
          })
        : [],
      fetchTravel
        ? this.prismaService.travelPackage.findMany({
            where: {
              ...(bookedMap.has('TRAVEL_PACKAGE')
                ? { id: { notIn: bookedMap.get('TRAVEL_PACKAGE')! } }
                : {}),
              ...buildLokasiFilter(),
            },
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
                    select: { id: true, nama: true, kode: true },
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
                select: { id: true, deskripsi: true, bahasa: true, nama: true },
              },
              travelPackageFile: { select: { id: true, nama_file: true, url: true } },
            },
          })
        : [],
      fetchKendaraan
        ? this.prismaService.kendaraan.count({
            where: {
              status: true,
              ...(bookedMap.has('KENDARAAN') ? { id: { notIn: bookedMap.get('KENDARAAN')! } } : {}),
              ...buildLokasiFilter(),
            },
          })
        : 0,
      fetchAkomodasi
        ? this.prismaService.akomodasi.count({
            where: {
              status: true,
              ...(bookedMap.has('AKOMODASI') ? { id: { notIn: bookedMap.get('AKOMODASI')! } } : {}),
              ...buildLokasiFilter(),
            },
          })
        : 0,
      fetchTravel
        ? this.prismaService.travelPackage.count({
            where: {
              ...(bookedMap.has('TRAVEL_PACKAGE')
                ? { id: { notIn: bookedMap.get('TRAVEL_PACKAGE')! } }
                : {}),
              ...buildLokasiFilter(),
            },
          })
        : 0,
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
      file_name: k.kendaraan_file?.[0]?.nama_file ?? '',
      file_url: k.kendaraan_file?.[0]?.url ?? '',
      lokasi: k.lokasi,
      durasi: k.kendaraan_durasi,
    }));

    const akomodasiItems = akomodasi.map(a => ({
      id: a.id,
      nama: a.nama,
      harga: Number(a.harga) || 500000,
      kategori: a.kategori,
      item_type: 'AKOMODASI',
      content: a.akomodasi_content,
      file_name: a.akomodasi_file?.[0]?.nama_file ?? '',
      file_url: a.akomodasi_file?.[0]?.url ?? '',
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
      file_name: t.travelPackageFile?.[0]?.nama_file ?? '',
      file_url: t.travelPackageFile?.[0]?.url ?? '',
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

  async getPopularPemesananItems(query: QueryParamsDto) {
    const { take, is_category } = query;

    const kendaraanPopular = await this.prismaService.pemesananItem.groupBy({
      by: ['item_id'],
      where: { item_type: 'KENDARAAN' },
      _count: { item_id: true },
      orderBy: { _count: { item_id: 'desc' } },
      take,
    });

    const akomodasiPopular = await this.prismaService.pemesananItem.groupBy({
      by: ['item_id'],
      where: { item_type: 'AKOMODASI' },
      _count: { item_id: true },
      orderBy: { _count: { item_id: 'desc' } },
      take,
    });

    const travelPopular = await this.prismaService.pemesananItem.groupBy({
      by: ['item_id'],
      where: { item_type: 'TRAVEL_PACKAGE' },
      _count: { item_id: true },
      orderBy: { _count: { item_id: 'desc' } },
      take,
    });

    const kendaraanIds = kendaraanPopular.map(p => p.item_id);
    const akomodasiIds = akomodasiPopular.map(p => p.item_id);
    const travelPackageIds = travelPopular.map(p => p.item_id);

    const [kendaraan, akomodasi, travelPackage] = await Promise.all([
      this.prismaService.kendaraan.findMany({
        where: { id: { in: kendaraanIds } },
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
        where: { id: { in: akomodasiIds } },
        select: {
          id: true,
          nama: true,
          kategori: true,
          harga: true,
          akomodasi_room_and_price: {
            select: {
              id: true,
              nama: true,
              harga: true,
            },
          },
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
        where: { id: { in: travelPackageIds } },
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
      file_name: k?.kendaraan_file[0]?.nama_file ?? '',
      file_url: k?.kendaraan_file[0]?.url ?? '',
      lokasi: k.lokasi,
      durasi: k.kendaraan_durasi,
    }));

    const akomodasiItems = akomodasi.map(a => ({
      id: a.id,
      nama: a.nama,
      harga: 500000,
      kategori: a.kategori,
      item_type: 'AKOMODASI',
      file_name: a?.akomodasi_file[0]?.nama_file ?? '',
      file_url: a?.akomodasi_file[0]?.url ?? '',
      lokasi: a.lokasi,
      room_and_price: a.akomodasi_room_and_price,
    }));

    const travelPackageItems = travelPackage.map(t => ({
      id: t.id,
      nama: t.nama,
      harga_anak: Number(t.harga_anak),
      harga_dewasa: Number(t.harga_dewasa),
      durasi_hari: t.durasi,
      item_type: 'TRAVEL_PACKAGE',
      file_name: t?.travelPackageFile[0]?.nama_file ?? '',
      file_url: t?.travelPackageFile[0]?.url ?? '',
      lokasi: t.lokasi,
      itinerary: t.travel_package_itinerary,
    }));

    if (is_category === 'true') {
      return {
        kendaraan: kendaraanItems,
        akomodasi: akomodasiItems,
        travel_package: travelPackageItems,
      };
    }

    const countMap = new Map<string, number>();

    kendaraanPopular.forEach(p => countMap.set(`KENDARAAN-${p.item_id}`, p._count.item_id));
    akomodasiPopular.forEach(p => countMap.set(`AKOMODASI-${p.item_id}`, p._count.item_id));
    travelPopular.forEach(p => countMap.set(`TRAVEL_PACKAGE-${p.item_id}`, p._count.item_id));

    const merged = [...kendaraanItems, ...akomodasiItems, ...travelPackageItems].map(item => {
      const key = `${item.item_type}-${item.id}`;
      return {
        ...item,
        count: countMap.get(key) ?? 0,
      };
    });

    merged.sort((a, b) => b.count - a.count);

    return merged.slice(0, take);
  }
}

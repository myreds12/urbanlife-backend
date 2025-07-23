import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatePemesananDto } from './dto/create-pemesanan.dto';
import { UpdatePemesananDto } from './dto/update-pemesanan.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import * as bcrypt from 'bcrypt';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { differenceInCalendarDays, endOfMonth, startOfMonth, subMonths } from 'date-fns'; // pastikan di-import

@Injectable()
export class PemesananService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}
  private readonly logger = new Logger(PemesananService.name);

  async create(createPemesananDto: CreatePemesananDto) {
    const { status, total_harga, nama, email, nomor_hp, deskripsi, order_item, type } =
      createPemesananDto;

    const userRole = await this.prismaService.roles.findFirst({
      where: { name: 'User' },
      select: { id: true },
    });

    if (!userRole) throw new NotFoundException('Role "User" tidak ditemukan');

    const defaultPassword = await bcrypt.hash(`${nama}-${nomor_hp}`, 10);

    // Step 1: Create User
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

    // Format Items
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

    // Step 2: Create Pemesanan (pakai id)
    const pemesanan = await this.prismaService.pemesanan.create({
      data: {
        type,
        status,
        deskripsi,
        total_harga,
        user: {
          connect: { id: createdUser.id }, // ✅ id pasti valid & unique
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

    // Jalankan sendMessage async
    this.sendPemesananMessage(pemesanan.id).catch(e =>
      this.logger.error(`❌ Gagal kirim pesan pemesanan WA: ${e.message}`),
    );

    return pemesanan;
  }

  async sendPemesananMessage(pemesananId: number) {
    try {
      const pemesanan = await this.prismaService.pemesanan.findUnique({
        where: { id: pemesananId },
        include: {
          user: true,
          pemesanan_item: true,
        },
      });

      if (!pemesanan) throw new Error(`Pemesanan ID ${pemesananId} tidak ditemukan`);

      const itemIds = pemesanan.pemesanan_item.map(i => i.item_id);
      const durasiIds = pemesanan.pemesanan_item.map(i => i.durasi_id).filter(Boolean);
      const roomIds = pemesanan.pemesanan_item.map(i => i.room_id).filter(Boolean);

      // Batch Fetch
      const [kendaraans, durasiKendaraan, akomodasiRooms, travelPackages] = await Promise.all([
        this.prismaService.kendaraan.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, nama: true },
        }),
        this.prismaService.kendaraanDurasi.findMany({
          where: { id: { in: durasiIds as number[] } },
          select: { id: true, durasi: true },
        }),
        this.prismaService.akomodasiRoomAndPrice.findMany({
          where: { id: { in: roomIds as number[] } },
          include: { akomodasi: { select: { nama: true } } },
        }),
        this.prismaService.travelPackage.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, nama: true },
        }),
      ]);

      const kendaraanMap = new Map(kendaraans.map(k => [k.id, k.nama]));
      const durasiMap = new Map(durasiKendaraan.map(d => [d.id, d.durasi]));
      const roomMap = new Map(akomodasiRooms.map(r => [r.id, r]));
      const travelMap = new Map(travelPackages.map(t => [t.id, t.nama]));

      const itemTexts = pemesanan.pemesanan_item.map(item => {
        let namaItem = '';
        let durasi = '-';

        const tanggalMulai = item.tanggal_mulai ? new Date(item.tanggal_mulai) : null;
        const tanggalSelesai = item.tanggal_selesai ? new Date(item.tanggal_selesai) : null;
        const diff =
          tanggalMulai && tanggalSelesai
            ? differenceInCalendarDays(tanggalSelesai, tanggalMulai)
            : null;

        switch (item.item_type) {
          case 'KENDARAAN':
            namaItem = kendaraanMap.get(item.item_id) ?? 'Kendaraan';
            durasi =
              item.durasi_hari != null
                ? `${item.durasi_hari} hari`
                : item.durasi_id
                  ? `${durasiMap.get(item.durasi_id) ?? '-'}`
                  : '-';
            break;

          case 'TRAVEL_PACKAGE':
            namaItem = travelMap.get(item.item_id) ?? 'Travel Package';
            durasi = diff !== null ? `${diff} hari` : '-';
            break;

          case 'AKOMODASI':
            const room = roomMap.get(item.room_id ?? 0);
            namaItem = `${room?.akomodasi?.nama ?? 'Akomodasi'} - ${room?.nama ?? 'Room'}`;
            durasi = diff !== null ? `${diff} hari` : '-';
            break;

          default:
            namaItem = 'Item tidak dikenali';
        }

        return `• ${namaItem} (durasi ${durasi})`;
      });

      const adminWa = await this.prismaService.adminWa.findFirst({
        where: { is_active: true },
        select: { session: true },
      });

      if (!adminWa?.session) {
        this.logger.warn('⚠️ Tidak ada session WhatsApp admin yang aktif.');
        return;
      }

      const message =
        `Hi ${pemesanan.user.nama},\n\n` +
        `Terima kasih telah mempercayakan perjalanan anda bersama urbanlife.id.\n\n` +
        `Selesaikan pembayaran Order ID *${pemesanan.id}* untuk pemesanan berikut:\n\n` +
        `${itemTexts.join('\n')}\n\n` +
        `Total pembayaran:\nIDR ${Number(pemesanan.total_harga).toLocaleString('id-ID')}`;

      await this.whatsappService.sendMessage(
        adminWa.session,
        pemesanan.user.nomor_hp,
        message,
        pemesananId,
      );
    } catch (error) {
      this.logger.error(`❌ Gagal kirim pesan pemesanan WA: ${error.message}`);
    }
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

  async totalPemesanan() {
    try {
      const lastMonth = subMonths(new Date(), 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);

      // Total pemesanan bulan kemarin
      const totalPemesanan = await this.prismaService.pemesanan.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      // Ambil role "User"
      const userRole = await this.prismaService.roles.findFirst({
        where: { name: 'User' },
        select: { id: true },
      });

      let totalCustomer = 0;

      if (userRole) {
        // Total customer (user dengan role "User") yang mendaftar bulan kemarin
        totalCustomer = await this.prismaService.user.count({
          where: {
            role_id: userRole.id,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        });
      }

      return {
        pemesanan: totalPemesanan,
        customer: totalCustomer,
        periode: {
          bulan: lastMonth.getMonth() + 1, // +1 karena getMonth dimulai dari 0
          tahun: lastMonth.getFullYear(),
        },
      };
    } catch (error) {
      console.error('❌ Error fetching monthly pemesanan/customer:', error);
      throw error;
    }
  }

  async pemesananPerBulan(query: QueryParamsDto) {
    try {
      const { tahun } = query;
      const startDate = new Date(`${tahun}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${tahun}-12-31T23:59:59.999Z`);

      const pemesananList = await this.prismaService.pemesanan.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      });

      const countMap: Record<string, number> = {};

      for (const item of pemesananList) {
        const date = new Date(item.createdAt);
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const key = `${tahun}-${month}`;
        countMap[key] = (countMap[key] || 0) + 1;
      }

      const allMonths = Array.from({ length: 12 }, (_, i) => {
        const month = (i + 1).toString().padStart(2, '0');
        const key = `${tahun}-${month}`;
        return {
          month: key,
          count: countMap[key] || 0,
        };
      });

      return allMonths;
    } catch (error) {
      console.error('Error fetching pemesanan per bulan:', error);
      throw new Error('Failed to get pemesanan data by month');
    }
  }
}

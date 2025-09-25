import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatePemesananDto } from './dto/create-pemesanan.dto';
import { UpdatePemesananDto } from './dto/update-pemesanan.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import * as bcrypt from 'bcrypt';
import { eachDayOfInterval, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'; // pastikan di-import
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PemesananKendaraanDto } from './dto/pemesanan-kendaraan-update.dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class PemesananService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
    @InjectQueue('pemesanan-processing') private readonly pemesananQueue: Queue,
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

    // Step 2: Create Pemesanan
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
        pemesanan_item: true,
      },
    });

    // Step 3: Add to Bull Queue untuk background processing
    await this.pemesananQueue.add(
      'process-order',
      {
        orderId: pemesanan.id,
        customerEmail: pemesanan.user.email,
        customerPhone: pemesanan.user.nomor_hp,
        customerName: pemesanan.user.nama,
        status: 'PENDING',
        orderDetails: {
          id: pemesanan.id,
          total_harga: pemesanan.total_harga,
          type: pemesanan.type,
          items: pemesanan.pemesanan_item,
        },
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        timeout: 30000,
      },
    );

    await this.notificationService.createNotification(pemesanan.id, pemesanan.status, {
      type: 'ORDER_CREATED',
      message: `Order #${pemesanan.id} successfully created.`,
      data: pemesanan,
      user_id: createdUser.id,
      order_created_at: pemesanan.createdAt,
    });

    this.logger.log(`Pemesanan ${pemesanan.id} ditambahkan ke queue`);

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
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
              nomor_hp: true,
            },
          },
          pemesanan_item: {
            include: {
              durasi: true,
              room: true,
            },
          },
        },
      });

      await this.notificationService.createNotification(pemesanan.id, pemesanan.status, {
        type: 'ORDER_UPDATED',
        message: `Order #${pemesanan.id} sucessfully updated.`,
        data: pemesanan,
        user_id: pemesanan.user.id,
        order_created_at: pemesanan.updatedAt,
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
    try {
      const {
        take = 100,
        page = 1,
        is_category,
        date_from,
        date_to,
        negara_ids,
        lokasi_ids,
        harga_min,
        harga_max,
        services = [], // filter tipe
        type,
        category_id,
        top_attraction,
        is_order,
      } = query;

      const skip = (Number(page) - 1) * Number(take);

      // Build bookedMap sama seperti sebelumnya
      const bookedMap = new Map<'KENDARAAN' | 'AKOMODASI' | 'TRAVEL_PACKAGE', number[]>();

      if (is_order === true) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const bookedItems = await this.prismaService.pemesananItem.findMany({
          where: {
            tanggal_mulai: { lte: todayEnd },
            tanggal_selesai: { gte: todayStart },
          },
          select: { item_id: true, item_type: true },
        });

        bookedItems.forEach(({ item_type, item_id }) => {
          const key = item_type as 'KENDARAAN' | 'AKOMODASI' | 'TRAVEL_PACKAGE';
          if (!bookedMap.has(key)) bookedMap.set(key, []);
          bookedMap.get(key)?.push(item_id);
        });
      } else if (date_from && date_to) {
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
        // Cek apakah negara_ids valid dan bukan hanya [0]
        const validNegaraIds =
          Array.isArray(negara_ids) &&
          negara_ids.length > 0 &&
          !(negara_ids.length === 1 && Number(negara_ids[0]) === 0);

        // Cek apakah lokasi_ids valid dan bukan hanya [0]
        const validLokasiIds =
          Array.isArray(lokasi_ids) &&
          lokasi_ids.length > 0 &&
          !(lokasi_ids.length === 1 && Number(lokasi_ids[0]) === 0);

        if (!validNegaraIds && !validLokasiIds) return undefined;

        return {
          lokasi: {
            ...(validNegaraIds ? { negara_id: { in: negara_ids.map(Number) } } : {}),
            ...(validLokasiIds ? { id: { in: lokasi_ids.map(Number) } } : {}),
          },
        };
      };

      const buildHargaFilter = (fieldName: string) => {
        const filter: any = {};
        if (harga_min !== undefined) filter.gte = harga_min;
        if (harga_max !== undefined) filter.lte = harga_max;
        return Object.keys(filter).length ? { [fieldName]: filter } : {};
      };

      // Tentukan tipe yang akan di-fetch berdasarkan services dan type
      const serviceTypes: ('KENDARAAN' | 'AKOMODASI' | 'TRAVEL_PACKAGE')[] =
        Array.isArray(services) && services.length > 0
          ? (services.filter(s =>
              ['KENDARAAN', 'AKOMODASI', 'TRAVEL_PACKAGE'].includes(s as any),
            ) as any)
          : type
            ? [type as any]
            : ['KENDARAAN', 'AKOMODASI', 'TRAVEL_PACKAGE'];

      // Fungsi fetch data per tipe tanpa pagination (ambil semua dulu)
      const fetchDataByType = async (serviceType: 'KENDARAAN' | 'AKOMODASI' | 'TRAVEL_PACKAGE') => {
        switch (serviceType) {
          case 'KENDARAAN':
            return this.prismaService.kendaraan.findMany({
              where: {
                status: true,
                status_pajak: true,
                ...(top_attraction ? { top_attraction: true } : {}),
                ...(bookedMap.has('KENDARAAN')
                  ? { id: { notIn: bookedMap.get('KENDARAAN')! } }
                  : {}),
                ...buildLokasiFilter(),
                kendaraan_durasi: {
                  some: buildHargaFilter('harga'),
                },
              },
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
                    negara: { select: { id: true, nama: true, kode: true } },
                  },
                },
                kendaraan_content: {
                  select: {
                    id: true,
                    deskripsi: true,
                    bahasa: true,
                    informasi: true,
                    kebijakan: true,
                  },
                },
                kendaraan_file: { select: { id: true, nama_file: true, url: true } },
                kendaraan_durasi: { select: { id: true, durasi: true, harga: true } },
              },
            });
          case 'AKOMODASI':
            return this.prismaService.akomodasi.findMany({
              where: {
                status: true,
                ...(top_attraction ? { top_attraction: true } : {}),
                ...(bookedMap.has('AKOMODASI')
                  ? { id: { notIn: bookedMap.get('AKOMODASI')! } }
                  : {}),
                ...buildLokasiFilter(),
                akomodasi_room_and_price: {
                  some: buildHargaFilter('harga'),
                },
              },
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
                    negara: { select: { id: true, nama: true, kode: true } },
                  },
                },
                akomodasi_room_and_price: { select: { id: true, nama: true, harga: true } },
                akomodasi_facility_group: {
                  select: {
                    id: true,
                    nama: true,
                    fasilitas: { select: { id: true, nama: true, facility_group_id: true } },
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
            });
          case 'TRAVEL_PACKAGE':
            return this.prismaService.travelPackage.findMany({
              where: {
                ...(top_attraction ? { top_attraction: true } : {}),
                ...(bookedMap.has('TRAVEL_PACKAGE')
                  ? { id: { notIn: bookedMap.get('TRAVEL_PACKAGE')! } }
                  : {}),
                ...(category_id ? { category_id } : {}),
                ...buildLokasiFilter(),
                ...buildHargaFilter('harga_dewasa'),
              },
              select: {
                id: true,
                nama: true,
                harga_anak: true,
                harga_dewasa: true,
                durasi: true,
                category: { select: { id: true, name: true } },
                lokasi: {
                  select: {
                    id: true,
                    nama: true,
                    alamat: true,
                    negara: { select: { id: true, nama: true, kode: true } },
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
                travel_package_prices: {
                  select: { id: true, description: true, harga: true},
                },
              },
            });
          default:
            return [];
        }
      };

      // Ambil data semua tipe yang diminta
      const dataByType = await Promise.all(serviceTypes.map(fetchDataByType));

      // Flatten dan map data ke bentuk standar
      const kendaraanItems = (dataByType[serviceTypes.indexOf('KENDARAAN')] || []).map(k => ({
        id: k.id,
        nama: k.nama,
        harga: Number(k.harga),
        tipe: k.tipe,
        item_type: 'KENDARAAN',
        model: k.model,
        kapasitas: k.kapasitas,
        status: k.status,
        content: k.kendaraan_content,
        file_name: k.kendaraan_file?.[0]?.nama_file ?? '',
        file_url: k.kendaraan_file?.[0]?.url ?? '',
        lokasi: k.lokasi,
        durasi: k.kendaraan_durasi,
      }));

      const akomodasiItems = (dataByType[serviceTypes.indexOf('AKOMODASI')] || []).map(a => ({
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

      const travelPackageItems = (dataByType[serviceTypes.indexOf('TRAVEL_PACKAGE')] || []).map(
        t => ({
          id: t.id,
          nama: t.nama,
          harga_anak: Number(t.harga_anak),
          harga_dewasa: Number(t.harga_dewasa),
          durasi: t.durasi,
          item_type: 'TRAVEL_PACKAGE',
          content: t.travel_package_content,
          itinerary: t.travel_package_itinerary,
          file_name: t.travelPackageFile?.[0]?.nama_file ?? '',
          file_url: t.travelPackageFile?.[0]?.url ?? '',
          lokasi: t.lokasi,
          package_prices: t.travel_package_prices,
        }),
      );

      // Gabungkan semua item
      const merged = [...kendaraanItems, ...akomodasiItems, ...travelPackageItems];

      // Total data gabungan
      const total = merged.length;

      // Pagination di memory
      const paginatedData = merged.slice(skip, skip + Number(take));

      if (is_category === 'true') {
        // Jika ingin data per kategori, kembalikan per tipe lengkap tanpa pagination
        return {
          kendaraan: kendaraanItems,
          akomodasi: akomodasiItems,
          travel_package: travelPackageItems,
          kendaraan_total: kendaraanItems.length,
          akomodasi_total: akomodasiItems.length,
          travel_package_total: travelPackageItems.length,
          page: Number(page),
          take: Number(take),
        };
      }

      return {
        data: paginatedData,
        meta: {
          total,
          page: Number(page),
          take: Number(take),
          take_total: paginatedData.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
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

  async pemesananCalendar(query: QueryParamsDto) {
    try {
      console.log('query', query);
      const { date_from, date_to } = query;

      if (!date_from || !date_to) {
        throw new Error('Parameter date_from dan date_to diperlukan');
      }

      const startDate = new Date(date_from);
      const endDate = new Date(date_to);

      console.log(typeof startDate, typeof endDate);

      const pemesananItems = await this.prismaService.pemesananItem.findMany({
        where: {
          tanggal_mulai: {
            lte: endDate,
          },
          tanggal_selesai: {
            gte: startDate,
          },
          // Pemesanan: {
          //   status: {
          //     notIn: ['CANCELLED'], // opsional: filter pemesanan aktif
          //   },
          // },
        },
        select: {
          tanggal_mulai: true,
          tanggal_selesai: true,
          item_type: true,
        },
      });

      const grouped: Record<string, Set<string>> = {};

      for (const item of pemesananItems) {
        const mulai = new Date(item.tanggal_mulai);
        const selesai = item.tanggal_selesai ? new Date(item.tanggal_selesai) : mulai;

        const range = eachDayOfInterval({ start: mulai, end: selesai });

        for (const date of range) {
          const dateStr = format(date, 'yyyy-MM-dd');
          if (!grouped[dateStr]) {
            grouped[dateStr] = new Set();
          }
          grouped[dateStr].add(item.item_type); // contoh: 'KENDARAAN', 'TRAVEL_PACKAGE', 'AKOMODASI'
        }
      }

      const allDates = eachDayOfInterval({ start: startDate, end: endDate });

      return allDates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          date: dateStr,
          categories: Array.from(grouped[dateStr] || []), // default []
        };
      });
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      throw new Error('Failed to get pemesanan calendar data');
    }
  }

  async getDetailByDate(date: string) {
    try {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);

      // Ambil semua pemesanan item di hari itu beserta user-nya
      const items = await this.prismaService.pemesananItem.findMany({
        where: {
          tanggal_mulai: {
            gte: start,
            lte: end,
          },
        },
        select: {
          item_id: true,
          item_type: true,
          Pemesanan: {
            select: {
              user: {
                select: {
                  nama: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Filter hanya customer (role: 'user')
      const customerItems = items.filter(i => i.Pemesanan.user?.role.name === 'user');

      // Kelompokkan berdasarkan item_type
      const kendaraanIds = customerItems
        .filter(i => i.item_type.toLowerCase() === 'kendaraan')
        .map(i => i.item_id);

      const akomodasiIds = customerItems
        .filter(i => i.item_type.toLowerCase() === 'akomodasi')
        .map(i => i.item_id);

      const travelPackageIds = customerItems
        .filter(i => i.item_type.toLowerCase() === 'travel_package')
        .map(i => i.item_id);

      // Ambil data lokasi dari masing-masing model
      const [kendaraans, akomodasis, travelPackages] = await Promise.all([
        this.prismaService.kendaraan.findMany({
          where: { id: { in: kendaraanIds } },
          include: { lokasi: true },
        }),
        this.prismaService.akomodasi.findMany({
          where: { id: { in: akomodasiIds } },
          include: { lokasi: true },
        }),
        this.prismaService.travelPackage.findMany({
          where: { id: { in: travelPackageIds } },
          include: { lokasi: true },
        }),
      ]);

      // Buat map untuk lookup cepat
      const kendaraanMap = new Map(kendaraans.map(k => [k.id, k.lokasi?.nama || '-']));
      console.log(kendaraanMap, 'kendaraanMap');
      const akomodasiMap = new Map(akomodasis.map(a => [a.id, a.lokasi?.nama || '-']));
      const travelPackageMap = new Map(travelPackages.map(t => [t.id, t.lokasi?.nama || '-']));

      // Gabungkan hasil akhir
      const result = customerItems.map(item => {
        let lokasi = '-';
        if (item.item_type.toLowerCase() === 'kendaraan') {
          lokasi = kendaraanMap.get(item.item_id) || '-';
        } else if (item.item_type.toLowerCase() === 'akomodasi') {
          lokasi = akomodasiMap.get(item.item_id) || '-';
        } else if (item.item_type.toLowerCase() === 'travel_package') {
          lokasi = travelPackageMap.get(item.item_id) || '-';
        }

        return {
          customer: item.Pemesanan.user.nama,
          type: item.item_type,
          lokasi,
        };
      });

      return result;
    } catch (error) {
      console.log(error);
      console.error('Error fetching calendar data:', error);
      throw new Error('Failed to get pemesanan calendar data');
    }
  }

  async getFilters() {
    const [kendaraanDurasi, akomodasiRoom, travelPackages] = await Promise.all([
      this.prismaService.kendaraanDurasi.findMany({
        where: {
          kendaraan: {
            status: true,
            status_pajak: true,
          },
        },
        select: {
          harga: true,
          kendaraan: {
            select: {
              id: true,
              lokasi: {
                select: {
                  id: true,
                  nama: true,
                  negara: {
                    select: { id: true, nama: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prismaService.akomodasiRoomAndPrice.findMany({
        where: {
          akomodasi: {
            status: true,
          },
        },
        select: {
          harga: true,
          akomodasi: {
            select: {
              id: true,
              lokasi: {
                select: {
                  id: true,
                  nama: true,
                  negara: {
                    select: { id: true, nama: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prismaService.travelPackage.findMany({
        select: {
          id: true,
          harga_dewasa: true,
          harga_anak: true,
          lokasi: {
            select: {
              id: true,
              nama: true,
              negara: {
                select: { id: true, nama: true },
              },
            },
          },
        },
      }),
    ]);

    type LocationEntry = {
      id: number;
      name: string;
      parentIds: Set<number>;
    };

    const countryMap = new Map<number, LocationEntry>();
    const cityMap = new Map<number, LocationEntry>();

    const allPrices: number[] = [];

    const UNKNOWN_LOCATION_ID = 0;
    const UNKNOWN_LOCATION_NAME = 'Unknown';

    const kendaraanWithoutLocation = new Set<number>();

    const addLocation = (
      map: Map<number, LocationEntry>,
      id: number,
      name: string,
      parentId: number,
    ) => {
      if (!map.has(id)) {
        map.set(id, { id, name, parentIds: new Set([parentId]) });
      } else {
        map.get(id)!.parentIds.add(parentId);
      }
    };

    // Proses kendaraanDurasi
    kendaraanDurasi.forEach(item => {
      const parentId = item.kendaraan?.id;
      const lokasi = item.kendaraan?.lokasi;
      if (parentId) {
        if (lokasi) {
          addLocation(countryMap, lokasi.negara.id, lokasi.negara.nama, parentId);
          addLocation(cityMap, lokasi.id, lokasi.nama, parentId);
        } else {
          kendaraanWithoutLocation.add(parentId);
        }
      }
      if (typeof item.harga === 'number' && !isNaN(item.harga)) allPrices.push(item.harga);
    });

    // Tambahkan kendaraan tanpa lokasi ke lokasi 'Unknown'
    if (kendaraanWithoutLocation.size > 0) {
      if (!countryMap.has(UNKNOWN_LOCATION_ID)) {
        countryMap.set(UNKNOWN_LOCATION_ID, {
          id: UNKNOWN_LOCATION_ID,
          name: UNKNOWN_LOCATION_NAME,
          parentIds: new Set(),
        });
      }
      if (!cityMap.has(UNKNOWN_LOCATION_ID)) {
        cityMap.set(UNKNOWN_LOCATION_ID, {
          id: UNKNOWN_LOCATION_ID,
          name: UNKNOWN_LOCATION_NAME,
          parentIds: new Set(),
        });
      }
      const countryEntry = countryMap.get(UNKNOWN_LOCATION_ID)!;
      const cityEntry = cityMap.get(UNKNOWN_LOCATION_ID)!;
      kendaraanWithoutLocation.forEach(id => {
        countryEntry.parentIds.add(id);
        cityEntry.parentIds.add(id);
      });
    }

    // Proses akomodasiRoom
    akomodasiRoom.forEach(item => {
      const parentId = item.akomodasi?.id;
      const lokasi = item.akomodasi?.lokasi;
      if (parentId && lokasi) {
        addLocation(countryMap, lokasi.negara.id, lokasi.negara.nama, parentId);
        addLocation(cityMap, lokasi.id, lokasi.nama, parentId);
      }
      if (typeof item.harga === 'number' && !isNaN(item.harga)) allPrices.push(item.harga);
    });

    // Proses travelPackages
    travelPackages.forEach(item => {
      const parentId = item.id;
      const lokasi = item.lokasi;
      if (parentId && lokasi) {
        addLocation(countryMap, lokasi.negara.id, lokasi.negara.nama, parentId);
        addLocation(cityMap, lokasi.id, lokasi.nama, parentId);
      }
      if (typeof item.harga_dewasa === 'number' && !isNaN(item.harga_dewasa))
        allPrices.push(item.harga_dewasa);
      if (typeof item.harga_anak === 'number' && !isNaN(item.harga_anak))
        allPrices.push(item.harga_anak);
    });

    // Konversi Map ke array dan hitung count berdasarkan ukuran Set parentIds
    const countries = Array.from(countryMap.values()).map(({ parentIds, ...rest }) => ({
      ...rest,
      count: parentIds.size,
    }));

    const cities = Array.from(cityMap.values()).map(({ parentIds, ...rest }) => ({
      ...rest,
      count: parentIds.size,
    }));

    // Hitung union parentIds dari semua negara untuk "All"
    const allCountryParentIds = new Set<number>();
    countryMap.forEach(entry => {
      entry.parentIds.forEach(id => allCountryParentIds.add(id));
    });
    countries.unshift({ id: 0, name: 'All', count: allCountryParentIds.size });

    // Hitung union parentIds dari semua kota untuk "All" di cities (opsional)
    const allCityParentIds = new Set<number>();
    cityMap.forEach(entry => {
      entry.parentIds.forEach(id => allCityParentIds.add(id));
    });
    cities.unshift({ id: 0, name: 'All', count: allCityParentIds.size });

    // Hitung jumlah parent unik untuk setiap service
    const uniqueKendaraanIds = new Set(
      kendaraanDurasi.map(item => item.kendaraan?.id).filter(Boolean),
    );
    const uniqueAkomodasiIds = new Set(
      akomodasiRoom.map(item => item.akomodasi?.id).filter(Boolean),
    );
    const uniqueTravelPackageIds = new Set(travelPackages.map(item => item.id).filter(Boolean));

    const services = [
      { name: 'Rent car', count: uniqueKendaraanIds.size, type: 'KENDARAAN' },
      { name: 'Accommodation', count: uniqueAkomodasiIds.size, type: 'AKOMODASI' },
      { name: 'Day tour', count: uniqueTravelPackageIds.size, type: 'TRAVEL_PACKAGE' },
    ];

    const price = {
      min: allPrices.length ? Math.min(...allPrices) : 0,
      max: allPrices.length ? Math.max(...allPrices) : 0,
    };

    return { countries, cities, services, price };
  }

  async updateKendaraan(id: number, data: PemesananKendaraanDto) {
    const pemesanan = await this.prismaService.pemesanan.findFirst({
      where: { id },
      include: { pemesanan_item: true },
    });

    if (!pemesanan) {
      throw new NotFoundException(`Order ID ${id} not found`);
    }

    // Cari item kendaraan yang sudah ada dalam pemesanan
    const existingKendaraanItem = pemesanan.pemesanan_item.find(
      item => item.item_type === 'KENDARAAN',
    );

    if (!existingKendaraanItem) {
      throw new NotFoundException('No vehicle item found in the order to update');
    }

    // console.log(pemesanan.total_harga, 'pemesanan.total_harga');
    // console.log(existingKendaraanItem.total_harga, 'existingKendaraanItem.total_harga');
    // console.log(data.harga, 'data.harga');
    // return console.log(
    //   Number(pemesanan.total_harga) -
    //     Number(existingKendaraanItem.total_harga) +
    //     Number(data.harga),
    // );

    // Gunakan transaction untuk update kedua entity secara atomic
    const result = await this.prismaService.$transaction(async prisma => {
      // 1. Update pemesanan_item dengan tipe KENDARAAN
      const updatedItem = await prisma.pemesananItem.update({
        where: {
          id: existingKendaraanItem.id,
        },
        data: {
          item_id: data.kendaraan_id,
          durasi_id: data.durasi_id,
          tanggal_mulai: existingKendaraanItem.tanggal_mulai,
          tanggal_selesai: existingKendaraanItem.tanggal_selesai,
          total_harga: data.harga,
        },
      });

      // 2. Update notes pada pemesanan
      const updatedPemesanan = await prisma.pemesanan.update({
        where: { id },
        data: {
          notes: data.notes,
          total_harga:
            Number(pemesanan.total_harga) -
            Number(existingKendaraanItem.total_harga) +
            Number(data.harga),
        },
      });

      return {
        updatedItem,
        updatedPemesanan,
      };
    });

    return result;
  }

  async updatePopularCategory(id: number, type: 'KENDARAAN' | 'AKOMODASI' | 'TRAVEL_PACKAGE') {
    try {
      return await this.prismaService.$transaction(async prisma => {
        let tableName: string;

        // Tentukan tabel berdasarkan type
        switch (type) {
          case 'KENDARAAN':
            tableName = 'kendaraan';
            break;
          case 'AKOMODASI':
            tableName = 'akomodasi';
            break;
          case 'TRAVEL_PACKAGE':
            tableName = 'travel_package';
            break;
          default:
            throw new BadRequestException('Invalid type');
        }

        // Cek apakah item ada
        const item = await prisma[tableName].findUnique({
          where: { id },
        });

        if (!item) {
          throw new NotFoundException(`${type} with ID ${id} not found`);
        }

        // Hitung jumlah item popular yang sudah ada untuk type ini
        const popularCount = await prisma[tableName].count({
          where: { is_popular: true },
        });

        // Jika sudah mencapai batas 6, cari item popular yang paling lama
        if (popularCount >= 6) {
          // Cari item popular dengan created_at tertua atau menggunakan kriteria lain
          const oldestPopularItem = await prisma[tableName].findFirst({
            where: { is_popular: true },
            orderBy: { created_at: 'asc' }, // Ganti dengan field yang sesuai jika perlu
          });

          if (oldestPopularItem) {
            // Update item yang lama menjadi tidak popular
            await prisma[tableName].update({
              where: { id: oldestPopularItem.id },
              data: { is_popular: false },
            });
          }
        }

        // Update item yang diinginkan menjadi popular
        const updatedItem = await prisma[tableName].update({
          where: { id },
          data: { is_popular: true },
        });

        return updatedItem;
      });
    } catch (error) {
      throw error;
    }
  }
}

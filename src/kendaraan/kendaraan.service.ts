import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateKendaraanDto } from './dto/create-kendaraan.dto';
import { UpdateKendaraanDto } from './dto/update-kendaraan.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class KendaraanService {
  constructor(
    private readonly prismaService: PrismaService, // Assuming you have a PrismaService for database operations
  ) {}
  async create(createKendaraanDto: CreateKendaraanDto, files: Express.Multer.File[]) {
    try {
      const {
        nama,
        tipe,
        plat_nomor,
        kapasitas,
        harga,
        lokasi_id,
        content,
        status_pajak,
        model,
        tanggal_pajak_berakhir,
        durasi,
      } = createKendaraanDto;

      // Validasi lokasi

      if (lokasi_id) {
        const lokasi = await this.prismaService.lokasi.findUnique({
          where: { id: lokasi_id },
          select: { id: true },
        });
        if (!lokasi) throw new NotFoundException(`Lokasi dengan ID ${lokasi_id} tidak ditemukan`);
      }

      // Persiapan data file
      const kendaraanFiles = files.map(file => ({
        nama_file: file.filename,
        url: file.path,
      }));

      // Persiapan konten kendaraan (jika ada)
      const kendaraanContent: Prisma.KendaraanContentCreateManyKendaraanInput[] =
        content?.map(item => ({
          deskripsi: item.deskripsi,
          bahasa: item.bahasa,
          informasi: item.informasi,
          kebijakan: item.kebijakan,
        })) ?? [];

      const kendaraanDurasi: Prisma.KendaraanDurasiCreateManyKendaraanInput[] =
        durasi?.map(item => ({
          durasi: item.durasi,
          harga: item.harga,
        })) ?? [];

      // Bangun data utama
      const kendaraanData: Prisma.KendaraanCreateInput = {
        nama,
        tipe,
        plat_nomor,
        kapasitas,
        harga,
        model,
        tanggal_pajak_berakhir: tanggal_pajak_berakhir ? new Date(tanggal_pajak_berakhir) : null,
        status_pajak: status_pajak ? Boolean(status_pajak) : undefined,
        ...(lokasi_id && { lokasi: { connect: { id: lokasi_id } } }),
        ...(kendaraanContent.length && {
          kendaraan_content: { createMany: { data: kendaraanContent } },
        }),
        ...(kendaraanFiles.length && {
          kendaraan_file: { createMany: { data: kendaraanFiles } },
        }),
        ...(kendaraanDurasi.length && {
          kendaraan_durasi: { createMany: { data: kendaraanDurasi } },
        }),
      };

      // Buat kendaraan dan ambil relasi
      return await this.prismaService.kendaraan.create({
        data: kendaraanData,
        include: {
          kendaraan_content: {
            select: { id: true, deskripsi: true, bahasa: true },
          },
          kendaraan_durasi: {
            select: { id: true, durasi: true, harga: true },
          },
          kendaraan_file: {
            select: { id: true, nama_file: true, url: true },
          },
        },
      });
    } catch (error) {
      console.log(error);
      console.error('Create Kendaraan Error:', error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;
      const count = await this.prismaService.kendaraan.count();

      const kendaraan = await this.prismaService.kendaraan.findMany({
        skip,
        take: take > 0 ? take : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
            },
          },
          kendaraan_content: {
            select: {
              id: true,
              deskripsi: true,
              bahasa: true,
            },
          },
          kendaraan_durasi: {
            select: { id: true, durasi: true, harga: true },
          },
          kendaraan_file: {
            select: {
              id: true,
              nama_file: true,
              url: true,
            },
          },
        },
      });

      return {
        data: kendaraan,
        meta: {
          total: count,
          page,
          take,
          takeTotal: kendaraan.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const kendaraan = await this.prismaService.kendaraan.findUnique({
        where: { id },
        include: {
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
            },
          },
          kendaraan_durasi: {
            select: { id: true, durasi: true, harga: true },
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
        },
      });
      return kendaraan;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, dto: UpdateKendaraanDto, files: Express.Multer.File[]) {
    try {
      console.time('Update Kendaraan');

      const {
        lokasi_id,
        nama,
        tipe,
        plat_nomor,
        kapasitas,
        harga,
        content,
        durasi,
        model,
        status_pajak,
        tanggal_pajak_berakhir,
      } = dto;
      // ✅ Validasi lokasi jika diberikan
      if (lokasi_id) {
        const lokasi = await this.prismaService.lokasi.findUnique({
          where: { id: lokasi_id },
          select: { id: true },
        });
        if (!lokasi) throw new NotFoundException(`Lokasi dengan ID ${lokasi_id} tidak ditemukan`);
      }

      // ✅ Siapkan file (jika ada)
      const kendaraanFiles = files.map(file => ({
        nama_file: file.filename,
        url: file.path,
      }));

      // ✅ Siapkan upsert konten (jika ada)
      const contentUpserts: Prisma.KendaraanContentUpsertWithWhereUniqueWithoutKendaraanInput[] =
        content?.map(item => ({
          where: { id: item.id ?? 0, kendaraan_id: id },
          update: {
            deskripsi: item.deskripsi,
            kebijakan: item.kebijakan,
            bahasa: item.bahasa,
          },
          create: {
            deskripsi: item.deskripsi,
            kebijakan: item.kebijakan,
            bahasa: item.bahasa,
          },
        })) ?? [];

      const preservedContentIds = content?.filter(c => c.id).map(c => c.id) ?? [];

      const durasiUpserts: Prisma.KendaraanDurasiUpsertWithWhereUniqueWithoutKendaraanInput[] =
        durasi?.map(item => ({
          where: { id: item.id ?? 0, kendaraan_id: id },
          update: {
            durasi: item.durasi,
            harga: item.harga,
          },
          create: {
            durasi: item.durasi,
            harga: item.harga,
          },
        })) ?? [];

      const preservedDurasiIds = durasi?.filter(c => c.id).map(c => c.id) ?? [];

      // ✅ Bangun data update
      const data: Prisma.KendaraanUncheckedUpdateInput = {
        nama,
        tipe,
        plat_nomor,
        kapasitas,
        harga,
        model,
        status_pajak: status_pajak ? Boolean(status_pajak) : undefined,
        tanggal_pajak_berakhir: tanggal_pajak_berakhir ? new Date(tanggal_pajak_berakhir) : null,
        ...(lokasi_id && { lokasi_id }),
        ...(contentUpserts.length && {
          kendaraan_content: { upsert: contentUpserts },
        }),
        ...(durasiUpserts.length && {
          kendaraan_durasi: { upsert: durasiUpserts },
        }),
        ...(kendaraanFiles.length && {
          kendaraan_file: {
            createMany: { data: kendaraanFiles },
          },
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, __, ___, updated] = await this.prismaService.$transaction([
        this.prismaService.kendaraanContent.deleteMany({
          where: {
            kendaraan_id: id,
            ...(preservedContentIds.length && {
              id: { notIn: preservedContentIds },
            }),
          },
        }),
        this.prismaService.kendaaranFile.deleteMany({
          where: { kendaraan_id: id },
        }),
        this.prismaService.kendaraanDurasi.deleteMany({
          where: {
            kendaraan_id: id,
            ...(preservedDurasiIds.length && {
              id: { notIn: preservedDurasiIds },
            }),
          },
        }),
        this.prismaService.kendaraan.update({
          where: { id },
          data,
          include: {
            lokasi: {
              select: { id: true, nama: true, alamat: true },
            },
            kendaraan_content: {
              select: { id: true, deskripsi: true, bahasa: true },
            },
            kendaraan_durasi: {
              select: { id: true, durasi: true, harga: true },
            },
            kendaraan_file: {
              select: { id: true, nama_file: true, url: true },
            },
          },
        }),
      ]);

      console.timeEnd('Update Kendaraan');
      return updated;
    } catch (error) {
      console.error('Update Kendaraan Error:', error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const kendaraan = await this.prismaService.kendaraan.findUnique({
        where: { id },
      });

      if (!kendaraan) {
        throw new NotFoundException(`Kendaraan dengan ID ${id} tidak ditemukan`);
      }

      await this.prismaService.$transaction([
        this.prismaService.kendaraanContent.deleteMany({
          where: { kendaraan_id: id },
        }),
        this.prismaService.kendaaranFile.deleteMany({
          where: { kendaraan_id: id },
        }),
        this.prismaService.kendaraan.update({
          where: { id },
          data: {
            status: false,
          },
        }),
      ]);

      return kendaraan;
    } catch (error) {
      throw error;
    }
  }

  async getCode() {
    try {
      const kendaraan = await this.prismaService.kendaraan.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 1,
      });

      return kendaraan[0] || null;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}

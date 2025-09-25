import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTravelPackageDto } from './dto/create-travel-package.dto';
import { UpdateTravelPackageDto } from './dto/update-travel-package.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { unlinkSync } from 'fs';

@Injectable()
export class TravelPackageService {
  constructor(private readonly prismaService: PrismaService) {}
  private logger = new Logger(TravelPackageService.name);

  async create(createTravelPackageDto: CreateTravelPackageDto, files: Express.Multer.File[]) {
    try {
      const {
        nama,
        harga_dewasa,
        durasi,
        travel_package_content,
        harga_anak,
        lokasi_id,
        travel_package_itinerary,
        category_id,
        guide_id,
        top_attraction,
        travel_package_prices,
      } = createTravelPackageDto;

      //validasi guide
      if (guide_id) {
        const guide = await this.prismaService.guide.findUnique({
          where: { id: guide_id },
          select: { id: true },
        });
        if (!guide) {
          throw new NotFoundException(`Guide dengan ID ${guide_id} tidak ditemukan`);
        }
      }

      const lokasi = await this.prismaService.lokasi.findUnique({
        where: { id: lokasi_id },
        select: { id: true },
      });

      if (!lokasi) {
        throw new NotFoundException(
          `Lokasi dengan ID ${createTravelPackageDto.lokasi_id} tidak ditemukan`,
        );
      }

      if (category_id) {
        const category = await this.prismaService.category.findUnique({
          where: { id: category_id },
          select: { id: true },
        });
        if (!category) {
          throw new NotFoundException(`Category dengan ID ${category_id} tidak ditemukan`);
        }
      }

      const travelPackageFiles = files.map(file => {
        return {
          nama_file: file.filename,
          url: file.path,
        };
      });

      const travelPackageContent = Array.isArray(createTravelPackageDto.travel_package_content)
        ? createTravelPackageDto.travel_package_content.map(item => ({
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            itinerary: item?.itinerary ?? '',
          }))
        : [];

      const TravelPackageItinerary: Prisma.TravelPackageItineraryCreateManyTravel_packageInput[] =
        Array.isArray(createTravelPackageDto.travel_package_itinerary)
          ? createTravelPackageDto.travel_package_itinerary.map(item => ({
              deskripsi: item.deskripsi,
              bahasa: item.bahasa,
              nama: item.nama,
            }))
          : [];

      const TravelPackagePrices: Prisma.TravelPackagePricesCreateManyTravel_packageInput[] =
        Array.isArray(createTravelPackageDto.travel_package_prices)
          ? createTravelPackageDto.travel_package_prices.map(item => ({
              description: item.description,
              harga: item.harga,
            }))
          : [];

      const travelPackage = await this.prismaService.travelPackage.create({
        data: {
          nama,
          harga_dewasa,
          harga_anak,
          top_attraction: top_attraction ? Boolean(top_attraction) : true,
          category: {
            connect: { id: category_id },
          },
          durasi,
          lokasi: {
            connect: { id: lokasi_id },
          },
          guide: {
            connect: { id: guide_id },
          },
          ...(travel_package_content && {
            travel_package_content: {
              createMany: {
                data: travelPackageContent,
              },
            },
          }),
          ...(travel_package_itinerary && {
            travel_package_itinerary: {
              createMany: {
                data: TravelPackageItinerary,
              },
            },
          }),
          travelPackageFile: {
            createMany: {
              data: travelPackageFiles,
            },
          },
          ...(travel_package_prices && {
            travel_package_prices: {
              createMany: {
                data: TravelPackagePrices,
              },
            },
          }),
        },
        include: {
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
              negara: {
                select: {
                  id: true,
                  nama: true,
                },
              },
            },
          },
          travel_package_content: {
            select: {
              id: true,
              bahasa: true,
              deskripsi: true,
              itinerary: true,
            },
          },
          travel_package_itinerary: {
            select: {
              id: true,
              bahasa: true,
              deskripsi: true,
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
          travel_package_prices: {
            select: {
              id: true,
              description: true,
              harga: true,
            },
          },
        },
      });

      return travelPackage;
    } catch (error) {
      console.log('ERROR: ', error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page, search } = query;
      const count = await this.prismaService.travelPackage.count();
      const where: Prisma.TravelPackageWhereInput = {
        ...(search && {
          OR: [
            {
              nama: {
                contains: search,
              },
            },
          ],
        }),
      };
      const travelPackages = await this.prismaService.travelPackage.findMany({
        where,
        skip: page * take - take,
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
              negara: {
                select: {
                  id: true,
                  nama: true,
                },
              },
            },
          },
          guide: {
            select: {
              id: true,
              nama: true,
              fluent_english: true,
              gender: true,
              nomor_hp: true,
              tanggal_periode_berakhir: true,
            },
          },
          travel_package_content: {
            select: {
              id: true,
              bahasa: true,
              deskripsi: true,
              itinerary: true,
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
      });
      return {
        data: travelPackages,
        meta: { page, take, total: count, takeTotal: travelPackages.length },
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const travelPackage = await this.prismaService.travelPackage.findUnique({
        where: { id },
        include: {
          lokasi: {
            select: {
              id: true,
              nama: true,
              alamat: true,
              negara: {
                select: {
                  id: true,
                  nama: true,
                },
              },
            },
          },
          guide: {
            select: {
              id: true,
              nama: true,
              fluent_english: true,
              gender: true,
              nomor_hp: true,
              tanggal_periode_berakhir: true,
            },
          },
          travel_package_content: {
            select: {
              id: true,
              bahasa: true,
              deskripsi: true,
              itinerary: true,
              kebijakan: true,
            },
          },
          travel_package_itinerary: {
            select: {
              id: true,
              bahasa: true,
              deskripsi: true,
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
          travel_package_prices: {
            select: {
              id: true,
              description: true,
              harga: true,
            },
          },
        },
      });
      return travelPackage;
    } catch (error) {
      throw error;
    }
  }

  async update(
    id: number,
    updateTravelPackageDto: UpdateTravelPackageDto,
    files: Express.Multer.File[],
  ) {
    try {
      const {
        nama,
        harga_dewasa,
        harga_anak,
        durasi,
        lokasi_id,
        travel_package_content,
        top_attraction,
        category_id,
        travel_package_itinerary,
        travel_package_prices,
      } = updateTravelPackageDto;

      // Validasi negara

      // Validasi lokasi
      if (lokasi_id) {
        const lokasi = await this.prismaService.lokasi.findUnique({
          where: { id: lokasi_id },
          select: { id: true },
        });
        if (!lokasi) {
          throw new NotFoundException(`Lokasi dengan ID ${lokasi_id} tidak ditemukan`);
        }
      }

      // Persiapkan ID konten yang ingin dipertahankan (untuk upsert dan delete)
      const preservedContentIds = travel_package_content?.filter(c => c.id).map(c => c.id) ?? [];
      console.log('preservedContentIds', preservedContentIds);
      const preservedItineraryIds =
        travel_package_itinerary?.filter(c => c.id).map(c => c.id) ?? [];
      const preservedPricesIds =
        travel_package_prices?.filter(c => c.id).map(c => c.id) ?? [];

      const upsertContent =
        travel_package_content?.map(item => ({
          where: { id: item.id ?? 0, travel_package_id: id },
          update: {
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            itinerary: item?.itinerary ?? '',
          },
          create: {
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            itinerary: item?.itinerary ?? '',
          },
        })) ?? [];

      const upsertItinerary =
        travel_package_itinerary?.map(item => ({
          where: { id: item.id ?? 0, travel_package_id: id },
          update: {
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            nama: item.nama,
          },
          create: {
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            nama: item.nama,
          },
        })) ?? [];
      
      const upsertPrices =
        travel_package_prices?.map(item => ({
          where: { id: item.id ?? 0, travel_package_id: id },
          update: {
            description: item.description,
            harga: item.harga,
          },
          create: {
            description: item.description,
            harga: item.harga,
          },
        })) ?? [];

      const fileData =
        files?.map(file => ({
          nama_file: file.filename,
          url: file.path,
        })) ?? [];

      // Jalankan transaksi update
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, __, ___, updatedPackage] = await this.prismaService.$transaction([
        // Hapus semua file sebelumnya
        this.prismaService.travelPackageFile.deleteMany({
          where: { travel_package_id: id },
        }),

        // Hapus konten yang tidak lagi dipertahankan
        this.prismaService.travelPackageContent.deleteMany({
          where: {
            travel_package_id: id,
            ...(preservedContentIds.length && {
              id: { notIn: preservedContentIds },
            }),
          },
        }),
        this.prismaService.travelPackageItinerary.deleteMany({
          where: {
            travel_package_id: id,
            ...(preservedItineraryIds.length && {
              id: { notIn: preservedItineraryIds },
            }),
          },
        }),
        this.prismaService.travelPackagePrices.deleteMany({
          where: {
            travel_package_id: id,
            ...(preservedPricesIds.length && {
              id: { notIn: preservedPricesIds },
            }),
          },
        }),

        // Update utama TravelPackage
        this.prismaService.travelPackage.update({
          where: { id },
          data: {
            nama,
            harga_anak,
            harga_dewasa,
            top_attraction: top_attraction ? Boolean(top_attraction) : true,
            ...(category_id && {
              category: {
                connect: { id: category_id },
              },
            }),
            durasi,
            ...(lokasi_id && { lokasi: { connect: { id: lokasi_id } } }),
            ...(upsertContent.length && {
              travel_package_content: {
                upsert: upsertContent,
              },
            }),
            ...(upsertItinerary.length && {
              travel_package_itinerary: {
                upsert: upsertItinerary,
              },
            }),
            ...(fileData.length && {
              travelPackageFile: {
                createMany: {
                  data: fileData,
                },
              },
            }),
            ...(upsertPrices.length && {
              travel_package_prices: {
                upsert: upsertPrices,
              },
            }),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            lokasi: true,
            travel_package_content: true,
            travel_package_itinerary: true,
            travelPackageFile: true,
            travel_package_prices: true,
          },
        }),
      ]);

      //Menghapus file secara lokal sesuai dengan data base

      const existingFiles = await this.prismaService.travelPackageFile.findMany({
        where: { travel_package_id: id },
      });

      existingFiles.forEach(file => {
        if (!fileData.find(f => f.url === file.url)) {
          unlinkSync(file.url);
        }
      });

      return updatedPackage;
    } catch (error) {
      console.error('Error updating travel package:', error);
      throw new BadRequestException('Gagal memperbarui paket perjalanan: ' + error.message);
    }
  }

  async remove(ids: number[]) {
    try {
      const travelPackage = await this.prismaService.travelPackage.findMany({
        where: {
          id: { in: ids },
        },
        include: {
          travelPackageFile: true,
        },
      });

      if (!travelPackage.length) {
        throw new NotFoundException(`Tidak ada travel ditemukan untuk ID ${ids.join(', ')}`);
      }

      for (const travel of travelPackage) {
        for (const file of travel.travelPackageFile) {
          try {
            unlinkSync(file.url); // Hapus file fisik
          } catch (err) {
            this.logger.warn(`⚠️ Gagal menghapus file: ${file.url}`);
          }
        }
      }

      await this.prismaService.$transaction([
        this.prismaService.travelPackageContent.deleteMany({
          where: { travel_package_id: { in: ids } },
        }),
        this.prismaService.travelPackageFile.deleteMany({
          where: { travel_package_id: { in: ids } },
        }),
        this.prismaService.travelPackage.deleteMany({
          where: { id: { in: ids } },
        }),
      ]);

      return travelPackage;
    } catch (error) {
      throw error;
    }
  }
}

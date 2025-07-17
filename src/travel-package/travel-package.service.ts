import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTravelPackageDto } from './dto/create-travel-package.dto';
import { UpdateTravelPackageDto } from './dto/update-travel-package.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class TravelPackageService {
  constructor(private readonly prismaService: PrismaService) {}
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
      } = createTravelPackageDto;

      const lokasi = await this.prismaService.lokasi.findUnique({
        where: { id: lokasi_id },
        select: { id: true },
      });

      if (!lokasi) {
        throw new NotFoundException(
          `Lokasi dengan ID ${createTravelPackageDto.lokasi_id} tidak ditemukan`,
        );
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

      const travelPackage = await this.prismaService.travelPackage.create({
        data: {
          nama,
          harga_dewasa,
          harga_anak,
          durasi,
          lokasi: {
            connect: { id: lokasi_id },
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
      const { take, page } = query;
      const count = await this.prismaService.travelPackage.count();
      const travelPackages = await this.prismaService.travelPackage.findMany({
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
        travel_package_itinerary,
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
      const preservedItineraryIds =
        travel_package_itinerary?.filter(c => c.id).map(c => c.id) ?? [];

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

        // Update utama TravelPackage
        this.prismaService.travelPackage.update({
          where: { id },
          data: {
            nama,
            harga_anak,
            harga_dewasa,
            durasi,
            ...(lokasi_id && { lokasi: { connect: { id: lokasi_id } } }),
            ...(upsertContent.length && {
              travelPackageContent: {
                upsert: upsertContent,
              },
            }),
            ...(upsertItinerary.length && {
              travelPackageItinerary: {
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
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            lokasi: true,
            travel_package_content: true,
            travel_package_itinerary: true,
            travelPackageFile: true,
          },
        }),
      ]);

      return updatedPackage;
    } catch (error) {
      console.error('Error updating travel package:', error);
      throw new BadRequestException('Gagal memperbarui paket perjalanan: ' + error.message);
    }
  }

  async remove(id: number) {
    try {
      const travelPackage = await this.prismaService.travelPackage.findUnique({
        where: { id },
      });

      if (!travelPackage) {
        throw new NotFoundException(`Travel Package dengan ID ${id} tidak ditemukan`);
      }

      await this.prismaService.$transaction([
        this.prismaService.travelPackageContent.deleteMany({
          where: { travel_package_id: id },
        }),
        this.prismaService.travelPackageFile.deleteMany({
          where: { travel_package_id: id },
        }),
        this.prismaService.travelPackage.delete({
          where: { id },
        }),
      ]);

      return travelPackage;
    } catch (error) {
      throw error;
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAkomodasiDto } from './dto/create-akomodasi.dto';
import { UpdateAkomodasiDto } from './dto/update-akomodasi.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class AkomodasiService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createAkomodasiDto: CreateAkomodasiDto, files: Express.Multer.File[]) {
    try {
      const {
        nama,
        lokasi_id,
        akomodasi_content,
        kategori,
        akomodasi_room,
        akomodasi_facility,
        status,
        tipe,
      } = createAkomodasiDto;

      const lokasi = await this.prismaService.lokasi.findUnique({
        where: { id: lokasi_id },
        select: { id: true },
      });
      if (!lokasi) throw new NotFoundException(`Lokasi dengan ID ${lokasi_id} tidak ditemukan`);

      const akomodasiContent: Prisma.AkomodasiContentCreateManyAkomodasiInput[] =
        akomodasi_content?.map(item => ({
          deskripsi: item.deskripsi,
          bahasa: item.bahasa,
          informasi: item.informasi,
          kebijakan: item.kebijakan,
        })) ?? [];

      const akomodasiRoomAndPrice: Prisma.AkomodasiRoomAndPriceCreateManyAkomodasiInput[] =
        akomodasi_room?.map(item => ({
          nama: item.nama,
          harga: item.harga,
        })) ?? [];

      const akomodasiFiles: Prisma.AkomodasiFileCreateManyAkomodasiInput[] = files.map(file => ({
        nama_file: file.filename,
        url: file.path,
      }));

      const akomodasiData: Prisma.AkomodasiCreateInput = {
        nama,
        kategori,
        status: Boolean(status),
        tipe,
        lokasi: { connect: { id: lokasi_id } },
        ...(akomodasiContent.length && {
          akomodasi_content: { createMany: { data: akomodasiContent } },
        }),
        ...(akomodasiRoomAndPrice.length && {
          akomodasi_room_and_price: { createMany: { data: akomodasiRoomAndPrice } },
        }),
        ...(akomodasiFiles.length && {
          akomodasi_file: { createMany: { data: akomodasiFiles } },
        }),
      };

      const result = await this.prismaService.$transaction(async tx => {
        const createdAkomodasi = await tx.akomodasi.create({
          data: akomodasiData,
        });

        // ✅ Buat group + fasilitas dalam 2 langkah
        const createdGroups = await Promise.all(
          akomodasi_facility.map(group =>
            tx.akomodasiFacilityGroup.create({
              data: {
                nama: group.nama,
                akomodasi: { connect: { id: createdAkomodasi.id } },
              },
            }),
          ),
        );

        for (let i = 0; i < createdGroups.length; i++) {
          const group = createdGroups[i];
          const fasilitas = akomodasi_facility[i].fasilitas;

          if (fasilitas && fasilitas.length) {
            await tx.akomodasiFacility.createMany({
              data: fasilitas.map(f => ({
                nama: f.nama,
                facility_group_id: group.id,
              })),
            });
          }
        }

        return tx.akomodasi.findUnique({
          where: { id: createdAkomodasi.id },
          include: {
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
                  select: { id: true, nama: true },
                },
              },
            },
          },
        });
      });

      // ✅ Kembalikan hasilnya langsung
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const count = await this.prismaService.akomodasi.count();
      const akomodasis = await this.prismaService.akomodasi.findMany({
        skip: page * take - take,
        take: take > 0 ? take : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          lokasi: {
            select: { id: true, nama: true },
          },
          akomodasi_content: {
            select: { id: true, deskripsi: true, bahasa: true, informasi: true, kebijakan: true },
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
          akomodasi_file: {
            select: { id: true, nama_file: true, url: true },
          },
        },
      });
      return {
        data: akomodasis,
        meta: { page, take, total: count, takeTotal: akomodasis.length },
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const akomodasi = await this.prismaService.akomodasi.findUnique({
        where: { id },
        include: {
          lokasi: {
            select: { id: true, nama: true },
          },
          akomodasi_content: {
            select: { id: true, deskripsi: true, bahasa: true, informasi: true, kebijakan: true },
          },
          akomodasi_file: {
            select: { id: true, nama_file: true, url: true },
          },
        },
      });
      if (!akomodasi) {
        throw new NotFoundException(`Akomodasi dengan ID ${id} tidak ditemukan`);
      }
      return akomodasi;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateAkomodasiDto: UpdateAkomodasiDto, files: Express.Multer.File[]) {
    try {
      const {
        nama,
        lokasi_id,
        akomodasi_content,
        kategori,
        akomodasi_facility,
        akomodasi_room,
        status,
        tipe,
      } = updateAkomodasiDto;

      if (lokasi_id) {
        const lokasi = await this.prismaService.lokasi.findUnique({
          where: { id: lokasi_id },
          select: { id: true },
        });
        if (!lokasi) throw new NotFoundException(`Lokasi dengan ID ${lokasi_id} tidak ditemukan`);
      }

      const akomodasiFiles: Prisma.AkomodasiFileCreateManyAkomodasiInput[] = files.map(file => ({
        nama_file: file.filename,
        url: file.path,
      }));

      const akomodasiContentUpserts: Prisma.AkomodasiContentUpsertWithWhereUniqueWithoutAkomodasiInput[] =
        akomodasi_content?.map(item => ({
          where: { id: item.id ?? 0, akomodasi_id: id },
          update: {
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            informasi: item.informasi,
            kebijakan: item.kebijakan,
          },
          create: {
            deskripsi: item.deskripsi,
            bahasa: item.bahasa,
            informasi: item.informasi,
            kebijakan: item.kebijakan,
          },
        })) ?? [];

      const akomodasiRoomAndPricesUpsert: Prisma.AkomodasiRoomAndPriceUpsertWithWhereUniqueWithoutAkomodasiInput[] =
        akomodasi_room?.map(item => ({
          where: { id: item.id ?? 0, akomodasi_id: id },
          update: {
            nama: item.nama,
            harga: item.harga,
          },
          create: {
            nama: item.nama,
            harga: item.harga,
          },
        })) ?? [];

      const preservedRoomAndPriceIds = akomodasi_room?.filter(c => c.id).map(c => c.id) ?? [];
      const preservedContentIds = akomodasi_content?.filter(c => c.id).map(c => c.id) ?? [];
      const preservedFacilityGroupIds =
        akomodasi_facility?.filter(fg => fg.id).map(fg => fg.id) ?? [];

      const data: Prisma.AkomodasiUpdateInput = {
        nama,
        kategori,
        ...(status ? { status: Boolean(status) } : undefined),
        tipe,
        lokasi: { connect: { id: lokasi_id } },
        ...(akomodasiContentUpserts.length && {
          akomodasi_content: { upsert: akomodasiContentUpserts },
        }),
        ...(akomodasiFiles.length && {
          akomodasiFile: { createMany: { data: akomodasiFiles } },
        }),
        ...(akomodasiRoomAndPricesUpsert.length && {
          akomodasi_room_and_price: { upsert: akomodasiRoomAndPricesUpsert },
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const akomodasi = await this.prismaService.$transaction(async tx => {
        await tx.akomodasiContent.deleteMany({
          where: {
            akomodasi_id: id,
            ...(preservedContentIds.length && {
              id: { notIn: preservedContentIds },
            }),
          },
        });

        await tx.akomodasiRoomAndPrice.deleteMany({
          where: {
            akomodasi_id: id,
            ...(preservedRoomAndPriceIds.length && {
              id: { notIn: preservedRoomAndPriceIds },
            }),
          },
        });

        await tx.akomodasiFile.deleteMany({
          where: { akomodasi_id: id },
        });

        const updatedAkomodasi = await tx.akomodasi.update({
          where: { id },
          data,
          include: {
            lokasi: { select: { id: true, nama: true } },
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
              select: { id: true, nama_file: true, url: true },
            },
          },
        });

        // ✅ Delete facility groups yang tidak dipertahankan
        await tx.akomodasiFacilityGroup.deleteMany({
          where: {
            akomodasi_id: id,
            ...(preservedFacilityGroupIds.length && {
              id: { notIn: preservedFacilityGroupIds },
            }),
          },
        });

        // ✅ Upsert groups & fasilitas
        await tx.akomodasiFacilityGroup.deleteMany({
          where: {
            akomodasi_id: id,
            ...(preservedFacilityGroupIds.length && {
              id: { notIn: preservedFacilityGroupIds },
            }),
          },
        });

        // 3. Loop untuk upsert setiap group dan fasilitas di dalamnya
        for (const group of akomodasi_facility ?? []) {
          let groupId = group.id;

          // Jika ada ID, lakukan update
          if (groupId) {
            await tx.akomodasiFacilityGroup.update({
              where: { id: groupId },
              data: { nama: group.nama },
            });
          } else {
            // Create jika tidak ada ID
            const createdGroup = await tx.akomodasiFacilityGroup.create({
              data: {
                nama: group.nama,
                akomodasi: { connect: { id } },
              },
            });
            groupId = createdGroup.id;
          }

          const fasilitas = group.fasilitas ?? [];
          const preservedFasilitasIds = fasilitas.filter(f => f.id).map(f => f.id);

          // Hapus fasilitas yang tidak dikirim lagi
          await tx.akomodasiFacility.deleteMany({
            where: {
              facility_group_id: groupId,
              ...(preservedFasilitasIds.length && {
                id: { notIn: preservedFasilitasIds },
              }),
            },
          });

          // Upsert fasilitas satu per satu
          for (const f of fasilitas) {
            if (f.id) {
              await tx.akomodasiFacility.update({
                where: { id: f.id },
                data: { nama: f.nama },
              });
            } else {
              await tx.akomodasiFacility.create({
                data: {
                  nama: f.nama,
                  facility_group_id: groupId,
                },
              });
            }
          }
        }

        return updatedAkomodasi;
      });

      return akomodasi;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const akomodasi = await this.prismaService.akomodasi.findUnique({
        where: { id },
      });

      if (!akomodasi) {
        throw new NotFoundException(`Akomodasi dengan ID ${id} tidak ditemukan`);
      }

      await this.prismaService.$transaction([
        this.prismaService.akomodasiContent.deleteMany({
          where: { akomodasi_id: id },
        }),
        this.prismaService.akomodasiFile.deleteMany({
          where: { akomodasi_id: id },
        }),
        this.prismaService.akomodasi.delete({
          where: { id },
        }),
      ]);

      return akomodasi;
    } catch (error) {
      throw error;
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAkomodasiDto } from './dto/create-akomodasi.dto';
import { UpdateAkomodasiDto } from './dto/update-akomodasi.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class AkomodasiService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(dto: CreateAkomodasiDto, files: Record<string, Express.Multer.File[]>) {
    try {
      const { akomodasi_content, akomodasi_facility, akomodasi_room, ...data } = dto;

      // 1. Buat Akomodasi
      const akomodasi = await this.prismaService.akomodasi.create({
        data: {
          ...data,
          harga: '0',
        },
      });

      // 2. Simpan Content (jika ada)
      if (akomodasi_content?.length) {
        for (const content of akomodasi_content) {
          await this.prismaService.akomodasiContent.create({
            data: {
              akomodasi_id: akomodasi.id,
              ...content,
            },
          });
        }
      }

      // 3. Simpan Room dan mapping temp_id -> room.id
      const roomMap = {}; // temp_id -> room.id
      for (const room of akomodasi_room) {
        const newRoom = await this.prismaService.akomodasiRoomAndPrice.create({
          data: {
            akomodasi_id: akomodasi.id,
            nama: room.nama,
            harga: room.harga,
          },
        });
        if (room.temp_id) {
          roomMap[room.temp_id] = newRoom.id;
        }
        console.log('🧩 Mapping temp_id:', room.temp_id, '→ room.id:', newRoom.id);
      }

      // 4. Simpan Facility Group + fasilitas
      for (const group of akomodasi_facility) {
        const facilityGroup = await this.prismaService.akomodasiFacilityGroup.create({
          data: {
            akomodasi_id: akomodasi.id,
            nama: group.nama,
          },
        });

        for (const f of group.fasilitas) {
          await this.prismaService.akomodasiFacility.create({
            data: {
              facility_group_id: facilityGroup.id,
              nama: f.nama,
            },
          });
        }
      }
      console.log('Room map:', roomMap);
      console.log('Uploaded file fields:', Object.keys(files));

      // 5. Simpan file utama (type = 1)
      const utamaFiles = files['files'] || [];
      for (const file of utamaFiles) {
        await this.prismaService.akomodasiFile.create({
          data: {
            akomodasi_id: akomodasi.id,
            type: 1,
            nama_file: file.filename,
            url: file.path,
          },
        });
      }

      // 6. Simpan file untuk tiap room (type = 2)
      for (const key in files) {
        if (key.startsWith('room_')) {
          const tempId = key.replace('room_', ''); // ✅ FIXED HERE
          const roomId = roomMap[tempId];

          console.log('Room file found:', key);
          console.log('Temp ID:', tempId);
          console.log('Room ID:', roomId);

          if (!roomId) continue;

          const roomFiles = files[key];
          for (const file of roomFiles) {
            console.log(
              '⏳ Uploading file for room_id:',
              roomId,
              'tempId:',
              tempId,
              'filename:',
              file.filename,
            );

            await this.prismaService.akomodasiFile.create({
              data: {
                akomodasi_id: akomodasi.id,
                room_id: roomId,
                type: 2,
                nama_file: file.filename,
                url: file.path,
              },
            });
          }
        }
      }

      // 7. Return lengkap
      return this.prismaService.akomodasi.findUnique({
        where: { id: akomodasi.id },
        include: {
          akomodasi_file: true,
          akomodasi_content: true,
          akomodasi_room_and_price: true,
          akomodasi_facility_group: {
            include: {
              fasilitas: true,
            },
          },
        },
      });
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

  async update(
    id: number,
    updateAkomodasiDto: UpdateAkomodasiDto,
    files: { [fieldname: string]: Express.Multer.File[] },
  ) {
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
        if (!lokasi) {
          throw new NotFoundException(`Lokasi dengan ID ${lokasi_id} tidak ditemukan`);
        }
      }

      const preservedRoomAndPriceIds = akomodasi_room?.filter(r => r.id).map(r => r.id) ?? [];
      const preservedContentIds = akomodasi_content?.filter(c => c.id).map(c => c.id) ?? [];
      const preservedFacilityGroupIds =
        akomodasi_facility?.filter(fg => fg.id).map(fg => fg.id) ?? [];

      const roomMap: Record<string, number> = {}; // temp_id → upserted room ID

      const akomodasi = await this.prismaService.$transaction(async tx => {
        // 🧹 Delete yang tidak digunakan lagi
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

        // 📝 Update data utama
        const updatedAkomodasi = await tx.akomodasi.update({
          where: { id },
          data: {
            nama,
            kategori,
            ...(status !== undefined ? { status: Boolean(status) } : {}),
            tipe,
            lokasi: { connect: { id: lokasi_id } },
          },
        });

        // 🛏️ Upsert Room + mapping temp_id
        for (const room of akomodasi_room ?? []) {
          const upsertedRoom = await tx.akomodasiRoomAndPrice.upsert({
            where: {
              id: room.id ?? 0,
              akomodasi_id: id,
            },
            update: {
              nama: room.nama,
              harga: room.harga,
            },
            create: {
              akomodasi_id: id,
              nama: room.nama,
              harga: room.harga,
            },
          });

          if (room.temp_id) {
            roomMap[room.temp_id] = upsertedRoom.id;
          }
        }

        // 🌐 Upsert Content
        for (const content of akomodasi_content ?? []) {
          await tx.akomodasiContent.upsert({
            where: {
              id: content.id ?? 0,
              akomodasi_id: id,
            },
            update: {
              deskripsi: content.deskripsi,
              informasi: content.informasi,
              kebijakan: content.kebijakan,
              bahasa: content.bahasa,
            },
            create: {
              akomodasi_id: id,
              deskripsi: content.deskripsi,
              informasi: content.informasi,
              kebijakan: content.kebijakan,
              bahasa: content.bahasa,
            },
          });
        }

        // 🖼️ Upload utama (type 1)
        for (const file of files['files'] ?? []) {
          await tx.akomodasiFile.create({
            data: {
              akomodasi_id: id,
              type: 1,
              nama_file: file.filename,
              url: file.path,
            },
          });
        }

        // 🖼️ Upload room file (type 2) berdasarkan temp_id → roomId
        for (const key of Object.keys(files)) {
          if (key.startsWith('room_temp-')) {
            const tempId = key.replace('room_temp-', '');
            const roomId = roomMap[tempId];
            if (!roomId) continue;

            for (const file of files[key]) {
              await tx.akomodasiFile.create({
                data: {
                  akomodasi_id: id,
                  room_id: roomId,
                  type: 2,
                  nama_file: file.filename,
                  url: file.path,
                },
              });
            }
          }
        }

        // ❌ Hapus facility group yang tidak dipertahankan
        await tx.akomodasiFacilityGroup.deleteMany({
          where: {
            akomodasi_id: id,
            ...(preservedFacilityGroupIds.length && {
              id: { notIn: preservedFacilityGroupIds },
            }),
          },
        });

        // 🔁 Upsert facility group & fasilitas
        for (const group of akomodasi_facility ?? []) {
          let groupId = group.id;

          if (groupId) {
            await tx.akomodasiFacilityGroup.update({
              where: { id: groupId },
              data: { nama: group.nama },
            });
          } else {
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

          await tx.akomodasiFacility.deleteMany({
            where: {
              facility_group_id: groupId,
              ...(preservedFasilitasIds.length && {
                id: { notIn: preservedFasilitasIds },
              }),
            },
          });

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
      console.error('❌ Error update akomodasi:', error);
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

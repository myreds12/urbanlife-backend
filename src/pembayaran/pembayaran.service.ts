import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';
import { UpdatePembayaranDto } from './dto/update-pembayaran.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { InvoiceApi } from 'xendit-node/invoice/apis';
import { createXenditInvoice } from 'src/utils/invoice/invoice';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { PemesananService } from 'src/pemesanan/pemesanan.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';

@Injectable()
export class PembayaranService {
  private readonly invoiceApi: InvoiceApi;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly pemesananService: PemesananService,
    private readonly whatsappService: WhatsappService,
  ) {}
  async handleXenditWebhook(payload: any) {
    const {
      id: invoiceId,
      status,
      payment_method,
      amount,
      // external_id,
      // payer_email,
      va_numbers,
      expiry_date,
    } = payload;

    if (!invoiceId || !status) {
      throw new InternalServerErrorException('Invalid webhook payload');
    }

    console.log(status, 'STATUS');

    // Cari data pembayaran di DB
    const pembayaran = await this.prismaService.pembayaran.findFirst({
      where: { invoice_id: invoiceId },
      include: { pemesanan: { select: { user: true } } }, // supaya dapat nomor HP user
    });

    if (!pembayaran) {
      throw new NotFoundException('Pembayaran tidak ditemukan');
    }

    const nomorWa = pembayaran.pemesanan.user.nomor_hp; // misal sudah disimpan di tabel user
    const metode = payment_method || 'UNKNOWN';

    // Ambil VA number (jika metode VA)
    let vaNumber: string | null = null;
    if (va_numbers && va_numbers.length > 0) {
      vaNumber = va_numbers[0].account_number;
    }

    switch (status) {
      case 'PENDING':
        // Kirim notif instruksi pembayaran
        await this.whatsappService.sendMessage(
          'default', // sessionId WA
          nomorWa,
          `Halo ${pembayaran.pemesanan.user.nama},\n\n` +
            `Silakan lakukan pembayaran sebesar Rp${amount} menggunakan metode ${metode}.\n` +
            `${vaNumber ? `Nomor Virtual Account: ${vaNumber}\n` : ''}` +
            `${expiry_date ? `Batas pembayaran: ${expiry_date}\n` : ''}\n` +
            `Terima kasih 🙏`,
          pembayaran.id,
        );
        break;

      case 'PAID':
        await this.prismaService.pembayaran.updateMany({
          where: { invoice_id: invoiceId },
          data: {
            status: 'PAID',
            tanggal_bayar: new Date(),
            metode,
          },
        });

        await this.whatsappService.sendMessage(
          'default',
          nomorWa,
          `✅ Pembayaran sebesar Rp${amount} telah diterima. Terima kasih telah melakukan transaksi dengan kami.`,
          pembayaran.id,
        );
        break;

      case 'EXPIRED':
        await this.prismaService.pembayaran.updateMany({
          where: { invoice_id: invoiceId },
          data: { status: 'EXPIRED' },
        });

        await this.whatsappService.sendMessage(
          'default',
          nomorWa,
          `⚠️ Pembayaran dengan invoice ${invoiceId} telah *kadaluarsa*. Silakan lakukan pemesanan ulang.`,
          pembayaran.id,
        );
        break;

      case 'FAILED':
        await this.prismaService.pembayaran.updateMany({
          where: { invoice_id: invoiceId },
          data: { status: 'FAILED' },
        });

        await this.whatsappService.sendMessage(
          'default',
          nomorWa,
          `❌ Pembayaran sebesar Rp${amount} *gagal diproses*. Silakan coba lagi.`,
          pembayaran.id,
        );
        break;

      default:
        return { message: `Status ${status} tidak ditangani secara eksplisit` };
    }

    return { message: `Webhook status ${status} diproses` };
  }

  async create(createPembayaranDto: CreatePembayaranDto, files: Express.Multer.File[]) {
    try {
      const { pemesanan_id, jumlah_bayar, metode, tanggal_bayar } = createPembayaranDto;

      const pemesanan = await this.pemesananService.findOne(pemesanan_id);

      if (!pemesanan) {
        throw new Error(`Pemesanan dengan ID ${pemesanan_id} tidak ditemukan`);
      }

      const firstItem = pemesanan.pemesanan_item?.find(x => x.is_priority == true);

      const typeLabel =
        firstItem?.item_type === 'KENDARAAN'
          ? 'kendaraan'
          : firstItem?.item_type === 'AKOMODASI'
            ? 'akomodasi'
            : firstItem?.item_type === 'TRAVEL_PACKAGE'
              ? 'paket perjalanan'
              : 'item';

      const itemName = firstItem?.detail?.nama || 'tidak diketahui';

      const description = `Pembayaran ${typeLabel} ${itemName} untuk pemesanan #${pemesanan_id}`;

      // Buat invoice Xendit
      let invoice;
      try {
        invoice = await createXenditInvoice({
          secretKey: process.env.XENDIT_API_KEY!,
          externalId: `INV-${pemesanan_id}-${Date.now()}`,
          amount: jumlah_bayar,
          payerEmail: pemesanan.user.email,
          description,
          successRedirectUrl: `${process.env.FE_URL}/PaymentSuccess`,
          failureRedirectUrl: `${process.env.FE_URL}/PaymentUnsuccess`,
        });
      } catch (err) {
        throw new InternalServerErrorException(`Gagal membuat invoice: ${err.message}`);
      }

      // File upload (optional)
      const pembayaranFiles =
        files?.map(file => ({
          nama_file: file.filename,
          url: file.path,
        })) ?? [];

      // Simpan pembayaran ke DB
      const pembayaran = await this.prismaService.pembayaran.create({
        data: {
          pemesanan_id,
          tanggal_bayar: tanggal_bayar ?? new Date(),
          jumlah_bayar,
          metode,
          status: invoice.status === 'PENDING' ? 'BELUM LUNAS' : 'PENDING',
          invoice_id: invoice.id,
          invoice_url: invoice.invoiceUrl,
          pembayaranFile: {
            createMany: {
              data: pembayaranFiles,
            },
          },
        },
        include: {
          pembayaranFile: true,
        },
      });

      return {
        ...pembayaran,
        invoiceUrl: invoice.invoiceUrl,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(`Gagal membuat pembayaran: ${error.message}`);
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = page * take - take;
      const count = await this.prismaService.pembayaran.count();
      const pembayaran = await this.prismaService.pembayaran.findMany({
        skip,
        take: take > 0 ? take : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          pemesanan: {
            select: {
              id: true,
              status: true,
              total_harga: true,
              deskripsi: true,
              pemesanan_item: {
                select: {
                  item_type: true,
                  durasi_hari: true,
                  item_id: true,
                  jumlah_anak: true,
                  jumlah_dewasa: true,
                  room: {
                    select: {
                      id: true,
                      nama: true,
                      harga: true,
                    },
                  },
                  durasi: {
                    select: {
                      id: true,
                      durasi: true,
                      harga: true,
                    },
                  },
                },
              },
            },
          },
          pembayaranFile: {
            select: {
              id: true,
              nama_file: true,
              url: true,
            },
          },
        },
      });
      return {
        data: pembayaran,
        meta: {
          total: count,
          page,
          take,
          takeTotal: pembayaran.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const pembayaran = await this.prismaService.pembayaran.findUnique({
        where: { id },
        include: {
          pemesanan: {
            select: {
              id: true,
              status: true,
              total_harga: true,
              deskripsi: true,
              pemesanan_item: {
                select: {
                  item_type: true,
                  durasi_hari: true,
                  item_id: true,
                  jumlah_anak: true,
                  jumlah_dewasa: true,
                  room: {
                    select: {
                      id: true,
                      nama: true,
                      harga: true,
                    },
                  },
                  durasi: {
                    select: {
                      id: true,
                      durasi: true,
                      harga: true,
                    },
                  },
                },
              },
            },
          },
          pembayaranFile: {
            select: {
              id: true,
              nama_file: true,
              url: true,
            },
          },
        },
      });
      return pembayaran;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updatePembayaranDto: UpdatePembayaranDto, files: Express.Multer.File[]) {
    const { pemesanan_id, metode, jumlah_bayar, status, tanggal_bayar } = updatePembayaranDto;

    // Validasi pemesanan_id jika ada
    if (pemesanan_id) {
      const pemesananExists = await this.prismaService.pemesanan.findUnique({
        where: { id: pemesanan_id },
        select: { id: true },
      });

      if (!pemesananExists) {
        throw new NotFoundException(`Pemesanan dengan ID ${pemesanan_id} tidak ditemukan`);
      }
    }

    const pembayaranFiles = files.map(file => ({
      nama_file: file.filename,
      url: file.path,
    }));

    const updateArgs: Prisma.PembayaranUpdateArgs = {
      where: { id },
      data: {
        ...(pemesanan_id && {
          pemesanan: { connect: { id: pemesanan_id } },
        }),
        metode,
        jumlah_bayar,
        status,
        tanggal_bayar,
        ...(pembayaranFiles.length && {
          pembayaranFile: {
            createMany: {
              data: pembayaranFiles,
            },
          },
        }),
      },
    };

    const [, updatedPembayaran] = await this.prismaService.$transaction([
      this.prismaService.pemabayaranFile.deleteMany({ where: { pembayaran_id: id } }),
      this.prismaService.pembayaran.update(updateArgs),
    ]);

    return updatedPembayaran;
  }

  async remove(id: number) {
    try {
      const pembayaran = await this.prismaService.pembayaran.findUnique({
        where: { id },
      });
      if (!pembayaran) {
        throw new NotFoundException(`Pembayaran dengan ID ${id} tidak ditemukan`);
      }

      await this.prismaService.$transaction([
        this.prismaService.pemabayaranFile.deleteMany({
          where: { pembayaran_id: id },
        }),
        this.prismaService.pembayaran.delete({
          where: { id },
        }),
      ]);
      return pembayaran;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

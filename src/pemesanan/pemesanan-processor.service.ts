// src/processor/pemesanan.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailsService } from 'src/mails/mails.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { differenceInCalendarDays } from 'date-fns';

@Processor('pemesanan-processing')
export class OrderProcessor {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Process('process-order')
  async handleOrderProcessing(job: Job) {
    const { orderId, customerEmail, customerName, status } = job.data;

    this.logger.log(`Memproses pemesanan ${orderId}...`);

    try {
      // Parallel processing untuk email dan WhatsApp
      const [emailResult, whatsappResult] = await Promise.allSettled([
        // Send email confirmation
        this.sendOrderConfirmationEmail(orderId, customerEmail, customerName),

        // Send WhatsApp messages
        this.sendPemesananMessage(orderId, status),
      ]);

      // Handle results
      if (emailResult.status === 'rejected') {
        this.logger.error(`Email gagal untuk order ${orderId}:`, emailResult.reason);
        throw new Error(`Email failed: ${emailResult.reason.message}`);
      }

      if (whatsappResult.status === 'rejected') {
        this.logger.warn(`WhatsApp gagal untuk order ${orderId}:`, whatsappResult.reason);
        // WhatsApp failure might not be critical, so we don't throw
      }

      this.logger.log(`Pemesanan ${orderId} berhasil diproses`);
      return {
        success: true,
        orderId,
        emailSent: emailResult.status === 'fulfilled',
        whatsappSent: whatsappResult.status === 'fulfilled',
      };
    } catch (error) {
      this.logger.error(`Gagal memproses pemesanan ${orderId}:`, error.message);
      throw error; // Bull akan auto retry
    }
  }

  private async sendOrderConfirmationEmail(
    orderId: number,
    customerEmail: string,
    customerName: string,
  ) {
    // Dapatkan data pemesanan untuk email
    const pemesanan = await this.prismaService.pemesanan.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        pemesanan_item: true,
      },
    });

    if (!pemesanan) {
      throw new Error(`Pemesanan ID ${orderId} tidak ditemukan`);
    }

    // Generate item texts untuk email
    const itemTexts = await this.generateItemTexts(pemesanan.pemesanan_item);

    // Kirim email
    await this.mailService.sendOrderConfirmation(customerEmail, {
      orderId: pemesanan.id,
      customerName: customerName || pemesanan.user.nama,
      items: itemTexts,
      total: +pemesanan.total_harga,
      orderDate: pemesanan.createdAt,
    });
  }

  // ✅ Metode sendPemesananMessage yang disesuaikan dengan model database
  async sendPemesananMessage(pemesananId: number, status: string) {
    try {
      const pemesanan = await this.prismaService.pemesanan.findUnique({
        where: { id: pemesananId },
        include: {
          user: true,
          pemesanan_item: true,
        },
      });

      if (!pemesanan) throw new Error(`Pemesanan ID ${pemesananId} tidak ditemukan`);

      // Generate item texts untuk WhatsApp
      const itemTexts = await this.generateItemTexts(pemesanan.pemesanan_item);

      const adminWa = await this.prismaService.adminWa.findFirst({
        where: { is_active: true },
        select: { session: true, nomor_wa: true },
      });

      if (!adminWa?.session) {
        this.logger.warn('⚠️ Tidak ada session WhatsApp admin yang aktif.');
        return;
      }

      const message = await this.prismaService.templateMessage.findFirst({
        where: { is_active: true, status: status },
        select: { text_to_customer: true, text_to_admin: true },
      });

      // ✅ Template pesan untuk customer
      const customerText =
        message?.text_to_customer ||
        `Hi ${pemesanan.user.nama},\n\n` +
          `Terima kasih telah mempercayakan perjalanan anda bersama urbanlife.id.\n\n` +
          `Selesaikan pembayaran Order ID *${pemesanan.id}* untuk pemesanan berikut:\n\n` +
          `${itemTexts.join('\n')}\n\n` +
          `Total pembayaran:\nIDR ${Number(pemesanan.total_harga).toLocaleString('id-ID')}`;

      // ✅ Kirim pesan ke customer
      await this.whatsappService.sendMessage(
        adminWa.session,
        pemesanan.user.nomor_hp,
        customerText,
        pemesananId,
      );

      // ✅ Jika ada pesan untuk admin, kirim ke admin juga
      if (message?.text_to_admin) {
        await this.whatsappService.sendMessage(
          adminWa.session,
          adminWa.nomor_wa,
          message.text_to_admin,
          pemesananId,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Gagal kirim pesan pemesanan WA: ${error.message}`);
      throw error;
    }
  }

  // ✅ Helper method untuk generate item texts berdasarkan item_type
  private async generateItemTexts(pemesananItems: any[]) {
    // Group items by type untuk efficient querying
    const kendaraanIds = pemesananItems
      .filter(item => item.item_type === 'KENDARAAN')
      .map(item => item.item_id);

    const travelPackageIds = pemesananItems
      .filter(item => item.item_type === 'TRAVEL_PACKAGE')
      .map(item => item.item_id);

    const akomodasiRoomIds = pemesananItems
      .filter(item => item.item_type === 'AKOMODASI')
      .map(item => item.room_id)
      .filter(Boolean);

    const durasiIds = pemesananItems
      .filter(item => item.durasi_id)
      .map(item => item.durasi_id)
      .filter(Boolean);

    // Parallel queries untuk semua data yang diperlukan
    const [kendaraans, travelPackages, akomodasiRooms, kendaraanDurasis] = await Promise.all([
      kendaraanIds.length > 0
        ? this.prismaService.kendaraan.findMany({
            where: { id: { in: kendaraanIds } },
            select: { id: true, nama: true },
          })
        : Promise.resolve([]),

      travelPackageIds.length > 0
        ? this.prismaService.travelPackage.findMany({
            where: { id: { in: travelPackageIds } },
            select: { id: true, nama: true },
          })
        : Promise.resolve([]),

      akomodasiRoomIds.length > 0
        ? this.prismaService.akomodasiRoomAndPrice.findMany({
            where: { id: { in: akomodasiRoomIds } },
            include: { akomodasi: { select: { nama: true } } },
          })
        : Promise.resolve([]),

      durasiIds.length > 0
        ? this.prismaService.kendaraanDurasi.findMany({
            where: { id: { in: durasiIds } },
            select: { id: true, durasi: true },
          })
        : Promise.resolve([]),
    ]);

    // Create maps untuk efficient lookup
    const kendaraanMap = new Map(kendaraans.map(k => [k.id, k.nama]));
    const travelPackageMap = new Map(travelPackages.map(t => [t.id, t.nama]));
    const akomodasiRoomMap = new Map(akomodasiRooms.map(r => [r.id, r]));
    const durasiMap = new Map(kendaraanDurasis.map(d => [d.id, d.durasi]));

    // Generate item texts
    return pemesananItems.map(item => {
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
          namaItem = travelPackageMap.get(item.item_id) ?? 'Travel Package';
          durasi = diff !== null ? `${diff} hari` : '-';
          break;

        case 'AKOMODASI':
          const room = akomodasiRoomMap.get(item.room_id);
          namaItem = room ? `${room.akomodasi?.nama ?? 'Akomodasi'} - ${room.nama}` : 'Akomodasi';
          durasi = diff !== null ? `${diff} hari` : '-';
          break;

        default:
          namaItem = 'Item tidak dikenali';
      }

      return `• ${namaItem} (durasi ${durasi}) - Rp ${Number(item.total_harga).toLocaleString('id-ID')}`;
    });
  }
}

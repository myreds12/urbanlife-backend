// src/processor/pemesanan.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailsService } from 'src/mails/mails.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
// import { differenceInCalendarDays } from 'date-fns';
import { PemesananItem } from '@prisma/client';

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

      const tanggal =  new Date(pemesanan.createdAt)
    .toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

      // ✅ Template pesan untuk customer
      const customerText =
        message?.text_to_customer ||
        `Hi ${pemesanan.user.nama},\n\n` +
          `Terima kasih telah mempercayakan perjalanan anda bersama urbanlife.id.\n\n` +
          `Selesaikan pembayaran Order ID *${pemesanan.id}* untuk pemesanan berikut:\n\n` +
          `${itemTexts.join('\n')}\n` +
          `Tanggal: ${tanggal}\n\n` +
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

  @Process('send-reminder')
  async handleSendReminder(job: Job<{ orderId: number }>) {
    await this.sendReminderNotification(job.data.orderId);
  }

  // pemesanan.processor.ts
  async sendReminderNotification(orderId: number) {
    try {
      const pemesanan = await this.prismaService.pemesanan.findUnique({
        where: { id: orderId },
        include: { user: true, pemesanan_item: true },
      });

      if (!pemesanan) {
        throw new NotFoundException(`Pemesanan ID ${orderId} tidak ditemukan`);
      }

      const reminderTemplate = await this.prismaService.templateMessage.findFirst({
        where: { category: 'Reminder', is_active: true },
        select: { text_to_customer: true, text_to_admin: true },
      });

      if (!reminderTemplate) {
        this.logger.warn(
          `⚠️ Tidak ditemukan template pesan reminder aktif untuk pemesanan ${orderId}`,
        );
        return;
      }

      const itemTexts = await this.generateItemTexts(pemesanan.pemesanan_item);

      const placeholders = {
        customerName: pemesanan.user.nama,
        orderId: pemesanan.id.toString(),
        items: itemTexts.join('\n'),
        total: Number(pemesanan.total_harga).toLocaleString('id-ID'),
      };

      const customerMessage = this.replacePlaceholders(
        reminderTemplate.text_to_customer,
        placeholders,
      );

      const adminWa = await this.prismaService.adminWa.findFirst({
        where: { is_active: true },
        select: { session: true, nomor_wa: true },
      });

      if (!adminWa?.session) {
        this.logger.warn('⚠️ Tidak ada session WhatsApp admin yang aktif.');
        return;
      }

      // Send WhatsApp to customer
      await this.whatsappService.sendMessage(
        adminWa.session,
        pemesanan.user.nomor_hp,
        customerMessage,
        orderId,
      );

      // Send WhatsApp to admin if exists
      if (reminderTemplate.text_to_admin) {
        const adminMessage = this.replacePlaceholders(reminderTemplate.text_to_admin, placeholders);
        await this.whatsappService.sendMessage(
          adminWa.session,
          adminWa.nomor_wa,
          adminMessage,
          orderId,
        );
      }

      // Send email
      await this.mailService.sendOrderReminder(pemesanan.user.email, {
        orderId: pemesanan.id,
        customerName: pemesanan.user.nama,
        items: itemTexts,
        total: Number(pemesanan.total_harga),
        orderDate: pemesanan.createdAt,
        note: 'Harap segera melakukan pembayaran', // optional
      });

      this.logger.log(`✅ Reminder notification berhasil dikirim untuk order ${orderId}`);
    } catch (error) {
      this.logger.error(
        `❌ Gagal kirim reminder notification untuk order ${orderId}: ${error.message}`,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Helper sederhana untuk replace placeholder {{key}}
   */
  private replacePlaceholders(template: string, data: Record<string, string>): string {
    return Object.entries(data).reduce(
      (text, [key, value]) => text.replace(new RegExp(`{{${key}}}`, 'g'), value),
      template,
    );
  }

  // ✅ Helper method untuk generate item texts berdasarkan item_type
  private async generateItemTexts(pemesananItems: PemesananItem[]): Promise<string[]> {
    const items: string[] = [];

    for (const item of pemesananItems) {
      switch (item.item_type) {
        case 'KENDARAAN': {
          const kendaraan = await this.prismaService.kendaraan.findUnique({
            where: { id: item.item_id },
            include: {
              driver: true,
            },
          });

          if (kendaraan) {
            items.push(
              `🚗 Kendaraan: ${kendaraan.nama} (${kendaraan.plat_nomor})\n` +
                `   Model: ${kendaraan.model ?? '-'}\n` +
                `   Kapasitas: ${kendaraan.kapasitas ?? '-'}\n` +
                `   Harga: Rp ${Number(kendaraan.harga).toLocaleString('id-ID')}\n` +
                (kendaraan.driver
                  ? `   Driver: ${kendaraan.driver.nama} (HP: ${kendaraan.driver.nomor_hp ?? '-'})\n`
                  : ''),
            );
          }
          break;
        }

        case 'TRAVEL_PACKAGE': {
          const paket = await this.prismaService.travelPackage.findUnique({
            where: { id: item.item_id },
            include: {
              guide: true,
            },
          });

          if (paket) {
            items.push(
              `🌍 Paket Wisata: ${paket.nama}\n` +
                `   Durasi: ${paket.durasi ?? '-'} ${paket.tipe_durasi}\n` +
                // `   Harga Dewasa: Rp ${Number(paket.harga_dewasa).toLocaleString('id-ID')}\n` +
                // `   Harga Anak: Rp ${Number(paket.harga_anak).toLocaleString('id-ID')}\n` +
                (paket.guide
                  ? `   Guide: ${paket.guide.nama} (HP: ${paket.guide.nomor_hp ?? '-'})\n`
                  : ''),
            );
          }
          break;
        }

        case 'AKOMODASI': {
          const akomodasi = await this.prismaService.akomodasi.findUnique({
            where: { id: item.item_id },
            include: {
              akomodasi_room_and_price: true,
            },
          });

          if (akomodasi) {
            items.push(
              `🏨 Akomodasi: ${akomodasi.nama}\n` +
                `   Kategori: ${akomodasi.kategori}\n` +
                `   Tipe: ${akomodasi.tipe}\n` +
                `   Harga: Rp ${Number(akomodasi.harga).toLocaleString('id-ID')}`,
            );
          }
          break;
        }

        default:
          items.push(`❓ Item dengan tipe ${item.item_type} tidak dikenali`);
      }
    }

    return items;
  }
}

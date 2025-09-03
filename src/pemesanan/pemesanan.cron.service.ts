import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { endOfDay, addDays, startOfDay } from 'date-fns';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class PemesananCronService {
  private readonly logger = new Logger(PemesananCronService.name);

  constructor(
    @InjectQueue('pemesanan-processing') private readonly orderQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updatePemesananStatusDone() {
    this.logger.log('🕛 Menjalankan cron update status pemesanan...');

    try {
      const pemesanans = await this.prisma.pemesanan.findMany({
        where: {
          status: { not: 'DONE' },
        },
        include: {
          pemesanan_item: {
            select: {
              tanggal_selesai: true,
            },
          },
          user: true,
        },
      });

      const today = endOfDay(new Date());

      const toUpdate = pemesanans.filter(pemesanan => {
        const latestDate = pemesanan.pemesanan_item
          .map(item => item.tanggal_selesai)
          .filter(date => date !== null)
          .sort((a, b) => b.getTime() - a.getTime())[0];

        return latestDate && latestDate < today;
      });

      const updated = await Promise.all(
        toUpdate.map(p =>
          this.prisma.pemesanan.update({
            where: { id: p.id },
            data: { status: 'DONE' },
            include: {
              user: true,
            },
          }),
        ),
      );

      this.logger.log(`✅ ${updated.length} pemesanan berhasil diupdate ke DONE.`);

      for (const p of updated) {
        await this.orderQueue.add('process-order', {
          orderId: p.id,
          customerEmail: p.user.email,
          customerName: p.user.nama,
          status: 'DONE',
        });
      }
    } catch (error) {
      this.logger.error('❌ Gagal update status pemesanan:', error);
    }
  }

  // Cronjob baru untuk Reminder Notifikasi satu hari sebelum tanggal selesai
  @Cron('0 8 * * *')
  async scheduleReminders() {
    this.logger.log('🔔 Menjalankan cron reminder notifikasi pemesanan...');

    try {
      const tomorrowStart = startOfDay(addDays(new Date(), 1));
      const tomorrowEnd = endOfDay(addDays(new Date(), 1));

      const pemesanans = await this.prisma.pemesanan.findMany({
        where: {
          status: { not: 'DONE' },
          pemesanan_item: {
            some: {
              tanggal_mulai: {
                gte: tomorrowStart,
                lte: tomorrowEnd,
              },
            },
          },
        },
        select: { id: true }, // cukup ambil id
      });

      if (pemesanans.length === 0) {
        this.logger.log('ℹ️ Tidak ada pemesanan untuk di-reminder hari ini.');
        return;
      }

      for (const p of pemesanans) {
        await this.orderQueue.add('send-reminder', { orderId: p.id });
      }

      this.logger.log(`✅ ${pemesanans.length} pemesanan berhasil dijadwalkan untuk reminder.`);
    } catch (error) {
      this.logger.error('❌ Gagal menjadwalkan reminder notifikasi:', error);
    }
  }
}

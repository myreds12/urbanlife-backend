import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('notification')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('create')
  async handleCreateNotification(
    job: Job<{ pemesananId: number; data: Record<string, any>; status: string }>,
  ) {
    const { pemesananId, data, status } = job.data;
    console.log(data, 'data');

    try {
      await this.prisma.notification.create({
        data: {
          pemesanan_id: pemesananId,
          status,
          data: JSON.stringify(data), // simpan payload sebagai JSON
        },
      });
      console.log('SUCCESS');

      this.logger.log(`✅ Notification created for Pemesanan #${pemesananId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to create notification for Pemesanan #${pemesananId}: ${error.message}`,
      );
      throw error;
    }
  }
}

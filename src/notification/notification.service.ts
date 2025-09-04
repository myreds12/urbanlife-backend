import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue('notification') private notificationQueue: Queue,
    private readonly prismaService: PrismaService,
  ) {}
  private readonly logger = new Logger(NotificationService.name);

  async createNotification(pemesananId: number, status: string, data: Record<string, any>) {
    this.logger.log(`📩 Add notification job for order ${pemesananId}`);
    await this.notificationQueue.add('create', { pemesananId, status, data });
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take;
      const notifications = await this.prismaService.notification.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
      const count = await this.prismaService.notification.count();
      return {
        data: notifications,
        meta: {
          total: count,
          page,
          take,
          takeTotal: notifications.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

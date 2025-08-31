// whatsapp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as puppeteer from 'puppeteer'; // pastikan terinstall
import { CreateTemplateWhatsappDto } from './dto/create-template-whatsapp.dto';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';
import { UpdateTemplateWhatsappDto } from './dto/update-template-whatsapp.dto';

@Injectable()
export class WhatsappService {
  constructor(private readonly prismaService: PrismaService) {}

  private clients = new Map<string, Whatsapp>();
  private readonly logger = new Logger(WhatsappService.name);
  private readonly sessionStatus = new Map<string, boolean>();

  async connect(sessionId: string, user: { id: number }) {
    const existingClient = this.clients.get(sessionId);

    // ✅ Validasi ulang status sebenarnya (bukan hanya `has`)
    if (existingClient) {
      try {
        const isConnected = await existingClient.isConnected();
        if (isConnected) {
          return {
            session: sessionId,
            qr: '',
            status: true,
          };
        }
      } catch (e) {
        this.logger.warn(`⚠️ Sesi ${sessionId} ditemukan tapi tidak valid: ${e.message}`);
        this.clients.delete(sessionId); // Clean up if invalid
        this.sessionStatus.set(sessionId, false);
      }
    }

    // ✅ Lanjut ke setup baru
    const role = await this.prismaService.roles.findFirst({
      where: { name: 'Admin WhatsApp' },
      select: { id: true },
    });

    if (!role) throw new Error('Role "Admin WhatsApp" tidak ditemukan');

    const userAdmin = await this.prismaService.user.findUnique({
      where: { id: user.id },
      select: { id: true, nama: true, nomor_hp: true },
    });

    if (!userAdmin) throw new Error(`User dengan ID ${user.id} tidak ditemukan`);

    return new Promise((resolve, reject) => {
      let qrResolved = false;
      const browserPath = puppeteer.executablePath();

      create({
        session: sessionId,
        catchQR: base64Qrimg => {
          if (!qrResolved) {
            qrResolved = true;
            this.sessionStatus.set(sessionId, false);
            resolve({ session: sessionId, qr: base64Qrimg, status: false });
          }
        },
        statusFind: status => {
          if (status === 'isLogged' || status === 'inChat') {
            this.sessionStatus.set(sessionId, true);
            if (!qrResolved) {
              qrResolved = true;
              resolve({ session: sessionId, qr: '', status: true });
            }
          }
        },
        headless: true,
        tokenStore: 'file',
        folderNameToken: './tokens',
        autoClose: 0,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-zygote',
          '--disable-gpu',
          '--single-process',
        ],
        puppeteerOptions: {
          executablePath: browserPath,
        },
      })
        .then(async client => {
          this.clients.set(sessionId, client);
          this.logger.log(`✅ Sesi ${sessionId} berhasil dimulai`);

          // Ambil nomor WhatsApp yang sedang login
          let waNumber: string;
          try {
            const me = await client.getWid();
            waNumber = typeof me === 'string' ? me.split('@')[0] : 'UNKNOWN';
          } catch (err) {
            this.logger.warn('⚠️ Gagal mengambil nomor WhatsApp:', err.message);
            waNumber = 'UNKNOWN';
          }

          // Update user jika belum punya nomor_hp
          if ((!userAdmin.nomor_hp || userAdmin.nomor_hp === '') && waNumber !== 'UNKNOWN') {
            await this.prismaService.user.update({
              where: { id: user.id },
              data: {
                nomor_hp: waNumber,
              },
            });
            this.logger.log(`📱 Nomor HP user ${user.id} diperbarui: ${waNumber}`);
          }

          // Create atau update adminWa
          const existing = await this.prismaService.adminWa.findFirst({
            where: { user_id: user.id },
          });

          if (existing) {
            await this.prismaService.adminWa.update({
              where: { id: existing.id },
              data: {
                session: sessionId,
                is_active: true,
                nomor_wa: waNumber,
              },
            });
          } else {
            await this.prismaService.adminWa.create({
              data: {
                user: { connect: { id: userAdmin.id } },
                nama: userAdmin.nama,
                nomor_wa: waNumber,
                session: sessionId,
                is_active: true,
                role: { connect: { id: role.id } },
              },
            });
          }
        })
        .catch(err => {
          this.logger.error(`❌ Gagal memulai sesi ${sessionId}: ${err.message}`);
          reject(err);
        });
    });
  }

  async logout(sessionId: string): Promise<{ message: string }> {
    const client = this.clients.get(sessionId);

    if (client) {
      try {
        await client.logout();
        await client.close();
      } catch (err) {
        this.logger.warn(`⚠️ Gagal logout client ${sessionId}: ${err.message}`);
      }

      this.clients.delete(sessionId);
    }

    // Update status adminWa jadi tidak aktif
    try {
      await this.prismaService.adminWa.updateMany({
        where: { session: sessionId },
        data: { is_active: false },
      });
    } catch (err) {
      this.logger.warn(`⚠️ Gagal update status admin WA: ${err.message}`);
    }

    // Hapus folder token
    const sessionPath = path.join(process.cwd(), 'tokens', sessionId);
    try {
      await fs.rm(sessionPath, { recursive: true, force: true });
      this.logger.log(`🧹 Folder sesi ${sessionId} berhasil dihapus`);
    } catch (err) {
      this.logger.warn(`⚠️ Gagal hapus folder sesi ${sessionId}: ${err.message}`);
    }

    return {
      message: `✅ Session ${sessionId} telah di-logout, folder token & status admin dinonaktifkan.`,
    };
  }

  async sendMessage(sessionId: string, to: string, message: string, pemesanan_id: number) {
    try {
      const client = this.clients.get(sessionId);
      if (!client) {
        this.logger.warn('⚠️ Client tidak ditemukan.');
        return;
      }

      const cleanNumber = to.replace(/\D/g, '');
      const number = `${cleanNumber}@c.us`;

      // ✅ Cek apakah nomor terdaftar di WhatsApp
      const statusCheck = await client.checkNumberStatus(number);
      const isValidNumber = statusCheck?.canReceiveMessage ?? false;

      if (!isValidNumber) {
        // ❌ Nomor tidak terdaftar → langsung simpan status "tidak terkirim"
        await this.prismaService.notfikasiWa.create({
          data: {
            nomor_wa: to,
            waktu_kirim: new Date(),
            pesan: message,
            pemesanan_id: Number(pemesanan_id),
            status: 'tidak terkirim',
          },
        });
        this.logger.warn(`⚠️ Nomor ${to} bukan nomor WhatsApp aktif`);
        return { success: false, reason: 'Nomor tidak terdaftar di WhatsApp' };
      }

      // ✅ Nomor valid → kirim pesan
      const result = await client.sendText(number, message);
      if (result) {
        await this.prismaService.notfikasiWa.create({
          data: {
            nomor_wa: to,
            waktu_kirim: new Date(),
            pesan: message,
            pemesanan_id: Number(pemesanan_id),
            status: 'terkirim',
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`❌ Gagal mengirim pesan: ${error.message}`);
      throw error;
    }
  }

  isConnected(sessionId: string): boolean {
    return this.clients.has(sessionId) && this.sessionStatus.get(sessionId) === true;
  }

  async createTemplate(dto: CreateTemplateWhatsappDto) {
    try {
      const result = await this.prismaService.templateMessage.create({
        data: {
          name: dto.name,
          category: dto.category,
          text_to_admin: dto.text_to_admin,
          status: dto.status,
          text_to_customer: dto.text_to_customer,
        },
      });
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAllTemplate(query: QueryParamsDto) {
    try {
      const { take, page } = query;
      const skip = (page - 1) * take;
      const count = await this.prismaService.templateMessage.count();
      const result = await this.prismaService.templateMessage.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
      return {
        data: result,
        meta: {
          total: count,
          page,
          take,
          takeTotal: result.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOneTemplate(id: number) {
    try {
      const result = await this.prismaService.templateMessage.findUnique({
        where: { id },
      });
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateTemplate(id: number, dto: UpdateTemplateWhatsappDto) {
    try {
      const result = await this.prismaService.templateMessage.update({
        where: { id },
        data: {
          name: dto.name,
          category: dto.category,
          text_to_admin: dto.text_to_admin,
          status: dto.status,
          text_to_customer: dto.text_to_customer,
          updatedAt: new Date(),
        },
      });
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAllMessage(query: QueryParamsDto) {
    try {
      const { take, page, status } = query;
      const skip = (page - 1) * take;
      const count = await this.prismaService.notfikasiWa.count();
      const where = {
        ...(status && { status }),
      };
      const result = await this.prismaService.notfikasiWa.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
      return {
        data: result,
        meta: {
          total: count,
          page,
          take,
          takeTotal: result.length,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async deleteTemplate(id: number) {
    try {
      const result = await this.prismaService.templateMessage.delete({
        where: { id },
      });
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

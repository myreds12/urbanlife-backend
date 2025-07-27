// whatsapp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WhatsappService {
  constructor(private readonly prismaService: PrismaService) {}

  private clients = new Map<string, Whatsapp>();
  private readonly logger = new Logger(WhatsappService.name);
  private readonly sessionStatus = new Map<string, boolean>();

  async connect(sessionId: string, user: { id: number }) {
    if (this.clients.has(sessionId)) {
      return {
        session: sessionId,
        qr: '',
        status: this.sessionStatus.get(sessionId) ?? false,
      };
    }

    const role = await this.prismaService.roles.findFirst({
      where: { name: 'Admin WhatsApp' },
      select: { id: true },
    });

    if (!role) {
      throw new Error('Role "Admin WhatsApp" tidak ditemukan');
    }

    const userAdmin = await this.prismaService.user.findUnique({
      where: { id: user.id },
      select: { id: true, nama: true, nomor_hp: true },
    });

    if (!userAdmin) {
      throw new Error(`User dengan ID ${user.id} tidak ditemukan`);
    }

    return new Promise((resolve, reject) => {
      let qrResolved = false;

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
        autoClose: 0,
        tokenStore: 'file',
        folderNameToken: './tokens',
        browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
        .then(async client => {
          this.clients.set(sessionId, client);
          this.logger.log(`✅ Sesi ${sessionId} berhasil dimulai`);

          const existing = await this.prismaService.adminWa.findFirst({
            where: { user_id: user.id },
          });

          if (existing) {
            await this.prismaService.adminWa.update({
              where: { id: existing.id },
              data: {
                session: sessionId,
                is_active: true,
              },
            });
          } else {
            await this.prismaService.adminWa.create({
              data: {
                user: { connect: { id: userAdmin.id } },
                nama: userAdmin.nama,
                nomor_wa: userAdmin.nomor_hp,
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

      const number = to.replace(/\D/g, '') + '@c.us';
      const result = await client.sendText(number, message);
      if (result) {
        await this.prismaService.notfikasiWa.create({
          data: {
            nomor_wa: to,
            waktu_kirim: new Date(),
            pesan: message,
            pemesanan_id: Number(pemesanan_id),
          },
        });
      }
      return result;
    } catch (error) {
      console.log(`❌ Gagal mengirim pesan: ${error}`);
      this.logger.error(`❌ Gagal mengirim pesan: ${error.message}`);
      throw error;
    }
  }

  isConnected(sessionId: string): boolean {
    return this.clients.has(sessionId) && this.sessionStatus.get(sessionId) === true;
  }
}

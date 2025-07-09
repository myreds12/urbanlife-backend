// whatsapp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class WhatsappService {
  private clients = new Map<string, Whatsapp>();
  private readonly logger = new Logger(WhatsappService.name);

  async connect(sessionId: string): Promise<{ session: string; qr: string; status: boolean }> {
    this.logger.debug(`🔄 Memulai sesi WhatsApp untuk: ${sessionId}`);

    if (this.clients.has(sessionId)) {
      this.logger.warn(`Session ${sessionId} already exists`);
      return { session: sessionId, qr: '', status: true }; // or return client state
    }

    return new Promise((resolve, reject) => {
      let qrResolved = false; // ✅ agar hanya resolve QR pertama saja

      create({
        session: sessionId,
        catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
          this.logger.log(`📸 QR (${attempts}x): ${urlCode}`);

          if (!qrResolved) {
            qrResolved = true;
            resolve({ session: sessionId, qr: base64Qrimg, status: true });
          } else {
            this.logger.debug(`ℹ️ QR code refreshed again (ignored in API response)`);
          }
        },
        statusFind: (status, session) => {
          this.logger.log(`🟢 Session ${session} status: ${status}`);

          if (status === 'inChat') {
            resolve({ session: sessionId, qr: '', status: true });
          }
        },
        headless: true,
        autoClose: 0,
        tokenStore: 'file',
        folderNameToken: './tokens',
      })
        .then(client => {
          this.logger.log(`✅ Sesi ${sessionId} berhasil dimulai`);
          this.clients.set(sessionId, client);
        })
        .catch(err => {
          this.logger.error(`❌ Gagal memulai sesi ${sessionId}: ${err.message}`);
          reject(err);
        });
    });
  }

  async logout(sessionId: string): Promise<{ message: string; qr: string }> {
    const client = this.clients.get(sessionId);
    if (client) {
      await client.logout();
      this.clients.delete(sessionId);
    }

    const tokenPath = path.join(process.cwd(), 'tokens', sessionId);
    try {
      const files = await fs.readdir(tokenPath);
      for (const file of files) {
        const filePath = path.join(tokenPath, file);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.warn(`⚠️ Gagal hapus file: ${filePath} - ${err.message}`);
        }
      }

      await fs.rmdir(tokenPath).catch(err => {
        console.warn(`⚠️ Gagal hapus folder: ${tokenPath} - ${err.message}`);
      });
    } catch (err) {
      console.warn(`⚠️ Folder session tidak ditemukan: ${tokenPath}`);
    }

    // Tunggu sejenak untuk memastikan proses puppeteer selesai
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Langsung re-init session (refresh QR)
    const qrResponse = await this.connect(sessionId);

    return {
      message: `✅ Session ${sessionId} telah di-logout & QR baru di-generate`,
      qr: qrResponse.qr,
    };
  }

  async sendMessage(sessionId: string, to: string, message: string) {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`Client ${sessionId} not connected`);
    }

    const number = to.replace(/\D/g, '') + '@c.us';
    return await client.sendText(number, message);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogoService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(files: Express.Multer.File[], body: any) {
    if (!files || files.length === 0) {
      return { message: 'No files uploaded' };
    }

    let types: string[] = [];

    try {
      const parsed = JSON.parse(body.types || '[]');
      types = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      if (typeof body.types === 'string' && body.types.length > 0) {
        types = body.types.includes(',')
          ? body.types.split(',').map((t) => t.trim())
          : [body.types];
      }
    }

    if (types.length < files.length) {
      const defaults = ['logo', 'favicon'];
      for (let i = types.length; i < files.length; i++) {
        types.push(defaults[i] || 'logo');
      }
    }

    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = types[i] || 'logo';
      const url = `/uploads/logo/${file.filename}`;
      const nama_file = file.filename;

      const existing = await this.prisma.logo.findFirst({ where: { type } });

      if (existing) {
        const oldFilePath = path.join(process.cwd(), 'uploads', 'logo', existing.nama_file);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log(`🗑️ File lama dihapus: ${existing.nama_file}`);
          } catch (err) {
            console.error('⚠️ Gagal hapus file lama:', err.message);
          }
        }

        const updated = await this.prisma.logo.update({
          where: { id: existing.id },
          data: {
            nama_file,
            url,
            updatedAt: new Date(),
          },
        });

        results.push(updated);
      } else {
        const created = await this.prisma.logo.create({
          data: {
            nama_file,
            url,
            type,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        results.push(created);
      }
    }

    return { message: 'Upload successful', data: results };
  }

  async findAll() {
    return this.prisma.logo.findMany({
      orderBy: { id: 'asc' },
    });
  }
}

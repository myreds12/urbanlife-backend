import { Module } from '@nestjs/common';
import { PembayaranService } from './pembayaran.service';
import { PembayaranController } from './pembayaran.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { fileFilter } from 'src/common/filters/file-filter';
import { extname } from 'path';
import { PemesananModule } from 'src/pemesanan/pemesanan.module';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/pembayaran',
        filename(req, file, callback) {
          const uniqueSuffix = `${Date.now()}`;
          const filename = `${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
      fileFilter: fileFilter,
    }),
    PemesananModule,
  ],
  controllers: [PembayaranController],
  providers: [PembayaranService],
})
export class PembayaranModule {}

import { Module } from '@nestjs/common';
import { AboutusService } from './aboutus.service';
import { AboutusController } from './aboutus.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { fileFilter } from 'src/common/filters/file-filter';
import { extname } from 'path';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/aboutus',
        filename(req, file, callback) {
          const uniqueSuffix = `${Date.now()}`;
          const filename = `${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
      fileFilter: fileFilter,
    }),
  ],
  controllers: [AboutusController],
  providers: [AboutusService],
})
export class AboutusModule {}

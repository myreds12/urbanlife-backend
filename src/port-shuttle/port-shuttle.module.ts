import { Module } from '@nestjs/common';
import { PortShuttleService } from './port-shuttle.service';
import { PortShuttleController } from './port-shuttle.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { fileFilter } from 'src/common/filters/file-filter';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/port-shuttle',
        filename(req, file, callback) {
          const uniqueSuffix = `${Date.now()}`;
          const filename = `${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
      fileFilter: fileFilter,
    }),
  ],
  controllers: [PortShuttleController],
  providers: [PortShuttleService],
})
export class PortShuttleModule {}

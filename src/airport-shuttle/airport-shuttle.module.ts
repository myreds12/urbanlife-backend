import { Module } from '@nestjs/common';
import { AirportShuttleService } from './airport-shuttle.service';
import { AirportShuttleController } from './airport-shuttle.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { fileFilter } from 'src/common/filters/file-filter';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/airport-shuttle',
        filename(req, file, callback) {
          const uniqueSuffix = `${Date.now()}`;
          const filename = `${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
      fileFilter: fileFilter,
    }),
  ],
  controllers: [AirportShuttleController],
  providers: [AirportShuttleService],
})
export class AirportShuttleModule {}

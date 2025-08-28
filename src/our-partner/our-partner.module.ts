import { Module } from '@nestjs/common';
import { OurPartnerService } from './our-partner.service';
import { OurPartnerController } from './our-partner.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { fileFilter } from 'src/common/filters/file-filter';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/our-partner',

        filename(req, file, callback) {
          const uniqueSuffix = `${Date.now()}`;
          const filename = `${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
      fileFilter: fileFilter,
    }),
  ],
  controllers: [OurPartnerController],
  providers: [OurPartnerService],
})
export class OurPartnerModule {}

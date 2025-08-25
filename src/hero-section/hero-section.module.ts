import { Module } from '@nestjs/common';
import { HeroSectionService } from './hero-section.service';
import { HeroSectionController } from './hero-section.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { fileFilter } from 'src/common/filters/file-filter';

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
  controllers: [HeroSectionController],
  providers: [HeroSectionService],
})
export class HeroSectionModule {}

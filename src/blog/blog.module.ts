import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { fileFilter } from 'src/common/filters/file-filter';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/blogs',
        filename(req, file, callback) {
          const uniqueSuffix = `${Date.now()}`;
          const filename = `${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
      fileFilter: fileFilter,
    }),
  ],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}

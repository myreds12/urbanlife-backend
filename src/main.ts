import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PrismaExceptionFilter } from './common/filters/prisma-known-exception.filter';
import { PrismaValidationFilter } from './common/filters/prisma-validation-error.filter';
import { NotFoundExceptionFilter } from './common/filters/not-found-exceptopm.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  const staticPath = join(__dirname, '..', 'uploads');
  console.log('Serving static files from:', staticPath);

  app.useStaticAssets(staticPath, {
    prefix: '/public/',
    setHeaders: res => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('URBAN LIFE REST API')
    .setDescription('The Urban Life REST API Documentation')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new PrismaValidationFilter(),
    new NotFoundExceptionFilter(),
  );
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT);
}
bootstrap();

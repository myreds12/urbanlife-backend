import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoleModule } from './role/role.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { KendaraanModule } from './kendaraan/kendaraan.module';
import { LokasiModule } from './lokasi/lokasi.module';
import { NegaraModule } from './negara/negara.module';
import { PemesananModule } from './pemesanan/pemesanan.module';
import { PembayaranModule } from './pembayaran/pembayaran.module';
import { TravelPackageModule } from './travel-package/travel-package.module';
import { NotifikasiWaModule } from './notifikasi-wa/notifikasi-wa.module';
import { AdminWaModule } from './admin-wa/admin-wa.module';
import { AkomodasiModule } from './akomodasi/akomodasi.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { GuideModule } from './guide/guide.module';
import { DriverModule } from './driver/driver.module';
import { NewsModule } from './news/news.module';
import { NewsCategoryModule } from './news-category/news-category.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CategoryModule } from './category/category.module';
import { BlogModule } from './blog/blog.module';
import { MailsModule } from './mails/mails.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AboutusModule } from './aboutus/aboutus.module';
import { ServiceScheduleModule } from './service-schedule/service-schedule.module';
import { HeroSectionModule } from './hero-section/hero-section.module';
import { TestimonialModule } from './testimonial/testimonial.module';
import { OurPartnerModule } from './our-partner/our-partner.module';
import { NotificationModule } from './notification/notification.module';
import { PrivacyandpolicyModule } from './privacyandpolicy/privacyandpolicy.module';
import { TermsandconditionModule } from './termsandcondition/termsandcondition.module';
import { LogoModule } from './logo/logo.module';
import { TypeAkomodasiModule } from './type-akomodasi/type-akomodasi.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'pemesanan-processing',
      },
      {
        name: 'notification',
      },
    ),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RoleModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    KendaraanModule,
    LokasiModule,
    NegaraModule,
    PemesananModule,
    PembayaranModule,
    TravelPackageModule,
    NotifikasiWaModule,
    AdminWaModule,
    AkomodasiModule,
    WhatsappModule,
    GuideModule,
    DriverModule,
    NewsModule,
    NewsCategoryModule,
    CategoryModule,
    BlogModule,
    MailsModule,
    AboutusModule,
    ServiceScheduleModule,
    HeroSectionModule,
    TestimonialModule,
    OurPartnerModule,
    NotificationModule,
    PrivacyandpolicyModule,
    TermsandconditionModule,
    LogoModule,
    TypeAkomodasiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

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
import { KotaModule } from './kota/kota.module';
import { GuideModule } from './guide/guide.module';
import { DriverModule } from './driver/driver.module';

@Module({
  imports: [
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
    KotaModule,
    GuideModule,
    DriverModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

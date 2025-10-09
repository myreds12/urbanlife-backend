import { Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { MailsController } from './mails.controller';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAILTRAP_HOST'),
          port: configService.get<number>('MAILTRAP_PORT'),
          secure: true,
          auth: {
            user: configService.get<string>('MAILTRAP_USER'),
            pass: configService.get<string>('MAILTRAP_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [MailsService],
  controllers: [MailsController],
  providers: [MailsService],
})
export class MailsModule {}

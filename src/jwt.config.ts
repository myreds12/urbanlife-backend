// jwt.config.ts
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const JwtConfig = {
  get user_secret() {
    return configService.get<string>('USER_SECRET');
  },
  get user_expired() {
    return configService.get<string>('USER_EXPIRED') || '1d';
  },
};

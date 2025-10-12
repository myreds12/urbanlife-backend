import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('USER_SECRET'),
    });

    console.log(
      'JWT_SECRET loaded:',
      configService.get<string>('USER_SECRET') ? 'Yes' : 'No (undefined!)',
    );
  }

  async validate(payload: any) {
    return {
      id: payload.id,
      nama: payload.nama,
      nomor_hp: payload.nomor_hp,
      email: payload.email,
      profile: payload.profile,
      role_id: payload.role_id,
      expired: payload.exp,
    };
  }
}

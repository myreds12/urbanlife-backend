/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConfig } from 'src/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JwtConfig.user_secret, // pakai env ya
    });
  }

  async validate(payload: any) {
    return {
      id: payload.id,
      nama: payload.nama,
      nomor_hp: payload.nomor_hp,
      role_id: payload.role_id,
      expired: payload.exp,
    };
  }
}

/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();

      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException({
          statusCode: 401,
          path: request.url,
          message: 'Token sudah kedaluwarsa. Silakan login kembali.',
          error: 'TokenExpired',
        });
      }

      if (info instanceof JsonWebTokenError) {
        throw new UnauthorizedException({
          statusCode: 401,
          path: request.url,
          message: 'Token tidak valid. Pastikan Anda sudah login.',
          error: 'InvalidToken',
        });
      }

      throw new UnauthorizedException({
        statusCode: 401,
        path: request.url,
        message: 'Akses ditolak. Token tidak ditemukan.',
        error: 'Unauthorized',
      });
    }

    return user;
  }
}

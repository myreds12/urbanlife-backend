/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { omit } from 'lodash';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { JwtConfig } from 'src/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    console.log('LOGIN DTO', loginDto.email, loginDto.password);
    const user = await this.usersService.findByEmail(loginDto.email);
    console.log(user);
    if (!user) {
      throw new HttpException('Username atau Password salah', HttpStatus.UNAUTHORIZED);
    }
    const checkPassword = await bcrypt.compare(loginDto.password, user.password);
    if (!checkPassword) {
      throw new HttpException('Password salah', HttpStatus.UNAUTHORIZED);
    }

    return await this.generateJwt(
      user,
      JwtConfig.user_secret,
      JwtConfig.user_expired,
      user.role.name,
    );
  }

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.usersService.create(
      {
        ...data,
        password: hashedPassword,
      },
      undefined,
    );
  }

  async generateJwt(user: User, secret: any, expired = JwtConfig.user_expired, roleUser: string) {
    const { id, email, nama, role_id } = user;

    const accessToken = this.jwtService.sign(
      {
        id: id,
        email,
        nama,
        role_id,
        role: roleUser,
      },
      {
        expiresIn: expired,
        secret,
      },
    );
    console.log('Access Token:', accessToken);
    const role = roleUser ? roleUser : 'user'; // Default to 'user' if no role is provided
    const expriresIn = expired || JwtConfig.user_expired;
    return {
      accessToken: accessToken,
      user: omit(user, ['password', 'created_at', 'updated_at', 'deleted_at']),
      role,
      expiresIn: expriresIn,
    };
  }

  async resetPassword(id: number, body: { new_password: string; confirm_password: string }) {
    try {
      if (body.new_password !== body.confirm_password) {
        throw new HttpException('Password tidak sama', HttpStatus.BAD_REQUEST);
      }

      const hashed = await bcrypt.hash(body.new_password, 10);
      return this.usersService.update(id, hashed);
    } catch (error) {
      throw error;
    }
  }
}

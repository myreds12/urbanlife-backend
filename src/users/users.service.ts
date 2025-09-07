/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { QueryParamsDto } from 'src/common/dto/query-params.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: {
      nama: string;
      email: string;
      nomor_hp: string;
      password: string;
      role_id: number;
    },
    file: Express.Multer.File,
  ) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      return await this.prisma.user.create({
        data: {
          profile: file?.path ?? undefined,
          nama: data.nama,
          email: data.email,
          nomor_hp: data.nomor_hp,
          password: hashedPassword,
          role: {
            connect: { id: data.role_id },
          },
        },
      });
    } catch (error) {
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  async findAll(query: QueryParamsDto) {
    try {
      const { take, page, is_admin, search } = query;
      const skip = page * take - take;
      const user = await this.prisma.user.findMany({
        where: {
          ...(is_admin && { role: { name: { not: 'user' } } }),
          ...(search && {
            OR: [{ email: { contains: search } }, { nama: { contains: search } }],
          }),
        },
        skip,
        take: take > 0 ? take : undefined,
        orderBy: { createdAt: 'desc' },
        include: { role: { select: { name: true } } },
      });
      return {
        data: user,
        meta: {
          total: await this.prisma.user.count({
            where: {
              ...(is_admin && { role: { name: { not: 'user' } } }),
            },
          }),
          page,
          take,
          takeTotal: user.length,
        },
      };
    } catch (error) {
      throw new Error('Error fetching users: ' + error.message);
    }
  }

  async findByEmail(email: string) {
    try {
      return this.prisma.user.findFirst({
        where: { email },
        include: { role: { select: { name: true } } },
      });
    } catch (error) {
      throw new Error('Error fetching user by email: ' + error.message);
    }
  }

  async findOne(id: number) {
    try {
      return this.prisma.user.findUnique({ where: { id }, include: { AdminWa: true } });
    } catch (error) {
      throw new Error('Error fetching user by id: ' + error.message);
    }
  }

  async update(id: number, data: any, file?: Express.Multer.File) {
    try {
      const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          nama: data.nama,
          email: data.email,
          nomor_hp: data.nomor_hp,
          password: hashedPassword,
          profile: file ? file.path : undefined,
          role: data.role_id ? { connect: { id: Number(data.role_id) } } : undefined,
        },
      });
      console.log('User updated successfully:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.log('ERROR BOS');
      console.log(error);
      throw new Error('Error updating user: ' + error.message);
    }
  }

  async remove(id: number) {
    try {
      return this.prisma.user.delete({ where: { id } });
    } catch (error) {
      throw new Error('Error deleting user: ' + error.message);
    }
  }

  async resetPassword(id: number, data: { new_password: string; confirm_password: string }) {
    if (data.new_password !== data.confirm_password) {
      throw new Error('Passwords do not match');
    }
    const hashedPassword = await bcrypt.hash(data.new_password, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}

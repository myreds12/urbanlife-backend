/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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

  async findAll() {
    try {
      return this.prisma.user.findMany();
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

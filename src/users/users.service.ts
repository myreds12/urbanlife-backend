/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const hashed = await bcrypt.hash(data.password, 10);
      return this.prisma.user.create({
        data: {
          nama: data.nama,
          email: data.email,
          nomor_hp: data.nomor_hp,
          role: {
            connect: { id: data.role_id },
          },
          password: hashed, // Ensure password is hashed in the controller or service
        },
      });
    } catch (error) {
      throw new Error();
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
      return this.prisma.user.findUnique({ where: { id } });
    } catch (error) {
      throw new Error('Error fetching user by id: ' + error.message);
    }
  }

  async update(id: number, data: any) {
    try {
      return this.prisma.user.update({ where: { id }, data });
    } catch (error) {
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
}

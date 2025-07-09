import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createRoleDto: CreateRoleDto) {
    try {
      const role = await this.prismaService.roles.create({
        data: createRoleDto,
      });
      return role;
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAll() {
    try {
      const roles = await this.prismaService.roles.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return roles;
    } catch (error) {
      throw new Error(error);
    }
  }

  async findOne(id: number) {
    try {
      const role = await this.prismaService.roles.findUnique({
        where: { id },
      });
      if (!role) {
        throw new Error(`Role with id ${id} not found`);
      }
      return role;
    } catch (error) {
      throw new Error(error);
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      const role = await this.prismaService.roles.update({
        where: { id },
        data: updateRoleDto,
      });
      return role;
    } catch (error) {
      throw new Error(error);
    }
  }

  async remove(id: number) {
    try {
      const role = await this.prismaService.roles.delete({
        where: { id },
      });
      return role;
    } catch (error) {
      throw new Error(error);
    }
  }
}

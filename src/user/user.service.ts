import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    delete user.password;
    return user;
  }

  // async update(id: number, updateUserDto: UpdateUserDto) {
  //   const newUser = await this.prisma.user.update({
  //     where: { id },
  //     data: updateUserDto,
  //   });
  //   delete newUser.password;
  //   return newUser;
  // }
}

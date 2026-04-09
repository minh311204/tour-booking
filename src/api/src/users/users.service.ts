import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prima.service'

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService) { }
  /** Danh sách user — có phân trang khi gửi `page` hoặc `pageSize` */
  async getUsers(query?: { page?: number; pageSize?: number }) {
    const paginate = query?.page != null || query?.pageSize != null
    if (paginate) {
      const page = query?.page ?? 1
      const pageSize = query?.pageSize ?? 10
      const [total, rows] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.findMany({
          orderBy: [{ createdAtUtc: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])
      return { items: rows, total, page, pageSize }
    }
    return this.prisma.user.findMany({
      orderBy: [{ createdAtUtc: 'desc' }, { id: 'desc' }],
    })
  }

  // Lay ra nguoi dung theo id
  async getUserById({
    id
  }: {
    id: number
  }) {
    var user = await this.prisma.user.findUnique({
      where: { id },
    })
    if (!user) {
      throw new Error('User not found')
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      role: user.role,
      status: user.status,
    }
  }

  // Cap nhat thong tin nguoi dung
  async updateUser(
    id: number,
    data: { firstName?: string; lastName?: string },
  ){
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if(!user) {
      throw new Error('User not found')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName
      },
    })

    console.log(`User ${id} updated with email: ${user.email}`);
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      emailVerified: updatedUser.emailVerified,
      role: updatedUser.role,
      status: updatedUser.status,
    }
  }

  // xoa nguoi dung
  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })
    if (!user) {
      throw new Error('User not found')
    }
    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'INACTIVE', // Thay vi xoa ban ghi, chi cap nhat trang thai thanh INACTIVE
      }
    })
    console.log(`User ${id} deleted with email: ${user.email}`);
    return true;
  }
}
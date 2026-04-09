import {
  Controller,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common'

import { UsersService } from './users.service'
import { userContract } from '../../../shared/contracts/user.contract'
import { TsRestHandler } from '@ts-rest/nest'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) { }

  private mapUserForContract(user: { id: number; email: string; firstName: string | null; lastName: string | null; status: string; role: string }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      status: user.status as 'ACTIVE' | 'INACTIVE' | 'BANNED',
      role: user.role as 'ADMIN' | 'USER',
    }
  }

  /** Chỉ ADMIN */
  @TsRestHandler(userContract.getUsers)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getUsers() {
    return async ({
      query,
    }: {
      query: { page?: number; pageSize?: number }
    }) => {
      const result = await this.usersService.getUsers(query)
      if (Array.isArray(result)) {
        return {
          status: 200,
          body: result.map((user) => this.mapUserForContract(user)),
        }
      }
      return {
        status: 200,
        body: {
          items: result.items.map((user) => this.mapUserForContract(user)),
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
        },
      }
    }
  }

  /** USER: chỉ xem chính mình; ADMIN: xem bất kỳ */
  @TsRestHandler(userContract.getUserById)
  @UseGuards(JwtAuthGuard)
  getUserById(@CurrentUser() currentUser: { id: number; role: string }) {
    return async ({ params }: { params: { id: string } }) => {
      const id = Number(params.id)
      if (currentUser.role !== 'ADMIN' && id !== currentUser.id) {
        throw new ForbiddenException()
      }
      const result = await this.usersService.getUserById({ id })
      return {
        status: 200,
        body: this.mapUserForContract(result),
      }
    }
  }

  /** USER: chỉ sửa profile của mình; ADMIN: sửa bất kỳ */
  @TsRestHandler(userContract.updateUser)
  @UseGuards(JwtAuthGuard)
  updateUser(@CurrentUser() user: { id: number; role: string }) {
    return async ({ params, body }: { params: { id: string }; body: { firstName?: string; lastName?: string } }) => {
      const targetId = Number(params.id)
      if (user.role !== 'ADMIN' && targetId !== user.id) {
        throw new ForbiddenException()
      }

      const result = await this.usersService.updateUser(targetId, body)
      return {
        status: 200,
        body: this.mapUserForContract(result),
      }
    }
  }

  /** Chỉ ADMIN */
  @TsRestHandler(userContract.deleteUser)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteUser() {
    return async ({ params }: { params: { id: string } }) => {
      const result = await this.usersService.deleteUser(Number(params.id))
      return {
        status: 200,
        body: { success: result },
      }
    }
  }
}

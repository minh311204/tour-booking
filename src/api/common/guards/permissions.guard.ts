/**
 * @deprecated Schema dùng `User.role` (ADMIN | USER) + `RolesGuard` / `@Roles()`.
 * Guard này phục vụ model cũ (UserRole + RolePermission). Không dùng cho flow mới.
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<{ resourceName: string; permission: number }>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!required) return true

    const { user } = context.switchToHttp().getRequest()
    const userRoles: any[] = Array.isArray(user?.roles) ? user.roles : []

    const hasPermission = userRoles.some((ur) => {
      const perms = ur?.role?.permissions
      if (!Array.isArray(perms)) return false

      return perms.some((p: any) => {
        if (p?.resourceName !== required.resourceName) return false

        // Treat permission as a bitmask.
        // Example: required=1 (001), user has=7 (111) => allowed.
        const userPerm = Number(p?.permission ?? 0)
        const requiredPerm = Number(required?.permission ?? 0)
        return (userPerm & requiredPerm) === requiredPerm
      })
    })

    if (!hasPermission) throw new ForbiddenException()
    return true
  }
}


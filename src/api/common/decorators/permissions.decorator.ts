import { SetMetadata } from '@nestjs/common'

export const PERMISSIONS_KEY = 'permissions'

export const Permissions = (resourceName: string, permission: number) =>
  SetMetadata(PERMISSIONS_KEY, { resourceName, permission })


import { ExceptionSchema } from '../exception/exception.schema'
import type { AppRouteResponse } from '@ts-rest/core'

export function withExceptionResponse<TR extends Record<number, AppRouteResponse>>(
  responses: TR,
): TR & Record<401 | 403 | 500, AppRouteResponse> {
  return {
    ...responses,
    401: ExceptionSchema,
    403: ExceptionSchema,
    500: ExceptionSchema,
  } as any
}

import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { withExceptionResponse } from './helpers'
import {
  SupplierResponseSchema,
  SupplierListPaginatedResponseSchema,
  CreateSupplierSchema,
  UpdateSupplierSchema,
} from '../schema/tour.schema'

const c = initContract()

const idParams = z.object({ id: z.coerce.number().int() })

export const supplierContract = c.router({
  getSuppliers: {
    method: 'GET',
    path: '',
    query: z.object({
      type: z
        .enum(['TRANSPORT', 'HOTEL', 'RESTAURANT', 'GUIDE', 'ACTIVITY'])
        .optional(),
      isActive: z.enum(['true', 'false']).optional(),
      q: z.string().optional(),
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
    }),
    responses: withExceptionResponse({
      200: z.union([
        z.array(SupplierResponseSchema),
        SupplierListPaginatedResponseSchema,
      ]),
    }),
  },

  getSupplierById: {
    method: 'GET',
    path: '/:id',
    pathParams: idParams,
    responses: withExceptionResponse({
      200: SupplierResponseSchema,
    }),
  },

  createSupplier: {
    method: 'POST',
    path: '/',
    body: CreateSupplierSchema,
    responses: withExceptionResponse({
      201: SupplierResponseSchema,
    }),
  },

  updateSupplier: {
    method: 'PUT',
    path: '/:id',
    pathParams: idParams,
    body: UpdateSupplierSchema,
    responses: withExceptionResponse({
      200: SupplierResponseSchema,
    }),
  },

  deleteSupplier: {
    method: 'DELETE',
    path: '/:id',
    pathParams: idParams,
    responses: withExceptionResponse({
      200: z.object({ message: z.string() }),
    }),
  },
})

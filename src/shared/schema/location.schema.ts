import { z } from 'zod'

// Region
export const RegionSchema = z.object({
    id: z.number(),
    name: z.string().nullable().optional()
})

export const CreateRegionSchema = z.object({
    name: z.string().nullable().optional()
})

export type CreateRegionRequest = z.infer<typeof CreateRegionSchema>    

export const UpdateRegionSchema = z.object({
    name: z.string().nullable().optional()
})

export type UpdateRegionRequest = z.infer<typeof UpdateRegionSchema>

export const RegionResponseSchema = z.object({
    id: z.number(),
    name: z.string().nullable().optional(),
})

export type RegionResponse = z.infer<typeof RegionResponseSchema>

/**
 * =========================
 * PROVINCE
 * =========================
 */

export const ProvinceSchema = z.object({
  id: z.number(),
  regionId: z.number(),
  name: z.string().nullable().optional(),
})

export const CreateProvinceSchema = z.object({
  regionId: z.number(),
  name: z.string().min(1),
})

export type CreateProvinceRequest = z.infer<typeof CreateProvinceSchema>

export const UpdateProvinceSchema = z.object({
  regionId: z.number().optional(),
  name: z.string().min(1).optional(),
})

export type UpdateProvinceRequest = z.infer<typeof UpdateProvinceSchema>

export const ProvinceResponseSchema = z.object({
  id: z.number(),
  regionId: z.number(),
  name: z.string().nullable().optional(),
})

export type ProvinceResponse = z.infer<typeof ProvinceResponseSchema>

/**
 * =========================
 * LOCATION
 * =========================
 */
export const LocationSchema = z.object({
  id: z.number(),
  provinceId: z.number(),
  name: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
})

export const CreateLocationSchema = z.object({
  provinceId: z.number(),
  name: z.string().min(1),

  latitude: z.number().optional(),
  longitude: z.number().optional(),

  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

export type CreateLocationRequest = z.infer<typeof CreateLocationSchema>



export const UpdateLocationSchema = z.object({
    provinceId: z.number().optional(),
    name: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().nullable().optional(),
})

export type UpdateLocationRequest = z.infer<typeof UpdateLocationSchema>

export const LocationResponseSchema = z.object({
    id: z.number(),
    provinceId: z.number(),
    name: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().nullable().optional(),
})

export type LocationResponse = z.infer<typeof LocationResponseSchema>

/**
 * =========================
 * NESTED RESPONSE (OPTIONAL)
 * =========================
 * dùng cho API trả về dạng tree
 */
export const LocationDetailSchema = LocationSchema.extend({
  province: ProvinceSchema.optional(),
})

export const ProvinceDetailSchema = ProvinceSchema.extend({
  region: RegionSchema.optional(),
  locations: z.array(LocationSchema).optional(),
})

export const RegionDetailSchema = RegionSchema.extend({
  provinces: z.array(ProvinceDetailSchema).optional(),
})
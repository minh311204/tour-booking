import { initContract } from "@ts-rest/core";
import { z } from 'zod'
import {
    CreateRegionSchema,
    UpdateRegionSchema,
    RegionResponseSchema,
    ProvinceResponseSchema,
    CreateProvinceSchema,
    UpdateProvinceSchema,
    LocationResponseSchema,
    UpdateLocationSchema,
    CreateLocationSchema
} from '../schema/location.schema'
import { withExceptionResponse } from "./helpers";

const c = initContract()

export const locationContract = c.router({
    // REGION
    getRegions: {
        method: 'GET',
        path: '/regions',
        responses: withExceptionResponse({
            200: z.array(RegionResponseSchema)
        })
    },

    getRegionById: {
        method: 'GET',
        path: '/regions/:id',
        responses: withExceptionResponse({
            200: RegionResponseSchema
        })
    },

    createRegion: {
        method: 'POST',
        path: '/regions',
        body: CreateRegionSchema,
        responses: withExceptionResponse({
            201: RegionResponseSchema
        })
    },

    updateRegion: {
        method: 'PUT',
        path: '/regions/:id',
        body: UpdateRegionSchema,
        responses: withExceptionResponse({
            200: RegionResponseSchema
        })
    },

    deleteRegion: {
        method: 'DELETE',
        path: '/regions/:id',
        responses: withExceptionResponse({
            200: z.object({
                message: z.string()
            })
        })
    },

    // PROVINCE
    getProvinces: {
        method: 'GET',
        path: '/provinces',
        responses: withExceptionResponse({
            200: z.array(ProvinceResponseSchema)
        })
    },

    getProvinceById: {
        method: 'GET',
        path: '/provinces/:id',
        responses: withExceptionResponse({
            200: ProvinceResponseSchema
        })
    },

    createProvince: {
        method: 'POST',
        path: '/provinces',
        body: CreateProvinceSchema,
        responses: withExceptionResponse({
            201: ProvinceResponseSchema
        })
    },

    updateProvince: {
        method: 'PUT',
        path: '/provinces/:id',
        body: UpdateProvinceSchema,
        responses: withExceptionResponse({
            200: ProvinceResponseSchema
        })
    },

    deleteProvince: {
        method: 'DELETE',
        path: '/provinces/:id',
        responses: withExceptionResponse({
            200: z.object({
                message: z.string()
            })
        })
    },

    // Location
    getLocations: {
        method: 'GET',
        path: '/locations',
        responses: withExceptionResponse({
            200: z.array(LocationResponseSchema)
        })
    },

    getLocationById: {
        method: 'GET',
        path: '/locations/:id',
        responses: withExceptionResponse({
            200: LocationResponseSchema
        })
    },

    createLocation: {
        method: 'POST',
        path: '/locations',
        body: CreateLocationSchema,
        responses: withExceptionResponse({
            201: LocationResponseSchema
        })
    },

    updateLocation: {
        method: 'PUT',
        path: '/locations/:id',
        body: UpdateLocationSchema,
        responses: withExceptionResponse({
            200: LocationResponseSchema
        })
    },

    deleteLocation: {
        method: 'DELETE',
        path: '/locations/:id',
        responses: withExceptionResponse({
            200: z.object({
                message: z.string()
            })
        })
    }
})

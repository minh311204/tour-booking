import { Controller, UseGuards } from '@nestjs/common'
import { LocationService } from './location.service'
import { locationContract } from '../../../shared/contracts/location.contract'
import { TsRestHandler } from '@ts-rest/nest'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // --- Public (đọc dữ liệu địa lý) ---

  @TsRestHandler(locationContract.getRegions)
  getRegions() {
    return async () => {
      const result = await this.locationService.getRegions()
      return {
        status: 200,
        body: result.map((region) => ({
          id: region.id,
          name: region.name,
        })),
      }
    }
  }

  @TsRestHandler(locationContract.getRegionById)
  getRegionById() {
    return async ({ params }: { params: { id: string } }) => {
      const result = await this.locationService.getRegionById(Number(params.id))
      return { status: 200, body: result }
    }
  }

  @TsRestHandler(locationContract.getProvinces)
  getProvinces() {
    return async () => {
      const result = await this.locationService.getProvinces()
      return {
        status: 200,
        body: result.map((province) => ({
          id: province.id,
          regionId: province.regionId,
          name: province.name,
        })),
      }
    }
  }

  @TsRestHandler(locationContract.getProvinceById)
  getProvinceById() {
    return async ({ params }: { params: { id: string } }) => {
      const result = await this.locationService.getProvinceById(Number(params.id))
      return { status: 200, body: result }
    }
  }

  @TsRestHandler(locationContract.getLocations)
  getLocations() {
    return async () => {
      const result = await this.locationService.getLocations()
      return {
        status: 200,
        body: result.map((location) => ({
          id: location.id,
          provinceId: location.provinceId,
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          description: location.description,
          isActive: location.isActive,
        })),
      }
    }
  }

  @TsRestHandler(locationContract.getLocationById)
  getLocationById() {
    return async ({ params }: { params: { id: string } }) => {
      const result = await this.locationService.getLocationById(Number(params.id))
      return { status: 200, body: result }
    }
  }

  // --- Chỉ ADMIN ---

  @TsRestHandler(locationContract.createRegion)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createRegion() {
    return async ({ body }: { body: { name?: string | null } }) => {
      const result = await this.locationService.createRegion(body)
      return { status: 201, body: result }
    }
  }

  @TsRestHandler(locationContract.updateRegion)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateRegion() {
    return async ({
      params,
      body,
    }: {
      params: { id: string }
      body: { name?: string | null }
    }) => {
      const result = await this.locationService.updateRegion(Number(params.id), body)
      return { status: 200, body: result }
    }
  }

  @TsRestHandler(locationContract.deleteRegion)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteRegion() {
    return async ({ params }: { params: { id: string } }) => {
      const result = await this.locationService.deleteRegion(Number(params.id))
      return { status: 200, body: { message: result.message } }
    }
  }

  @TsRestHandler(locationContract.createProvince)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createProvince() {
    return async ({
      body,
    }: {
      body: { regionId: number; name: string }
    }) => {
      const result = await this.locationService.createProvince(body)
      return { status: 201, body: result }
    }
  }

  @TsRestHandler(locationContract.updateProvince)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateProvince() {
    return async ({
      params,
      body,
    }: {
      params: { id: string }
      body: { regionId?: number; name?: string }
    }) => {
      const result = await this.locationService.updateProvince(Number(params.id), body)
      return { status: 200, body: result }
    }
  }

  @TsRestHandler(locationContract.deleteProvince)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteProvince() {
    return async ({ params }: { params: { id: string } }) => {
      const result = await this.locationService.deleteProvince(Number(params.id))
      return { status: 200, body: { message: result.message } }
    }
  }

  @TsRestHandler(locationContract.createLocation)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createLocation() {
    return async ({
      body,
    }: {
      body: {
        provinceId: number
        name: string
        latitude?: number
        longitude?: number
        description?: string
        isActive?: boolean
      }
    }) => {
      const result = await this.locationService.createLocation(body)
      return { status: 201, body: result }
    }
  }

  @TsRestHandler(locationContract.updateLocation)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateLocation() {
    return async ({
      params,
      body,
    }: {
      params: { id: string }
      body: Record<string, unknown>
    }) => {
      const result = await this.locationService.updateLocation(Number(params.id), body as any)
      return { status: 200, body: result }
    }
  }

  @TsRestHandler(locationContract.deleteLocation)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteLocation() {
    return async ({ params }: { params: { id: string } }) => {
      const result = await this.locationService.deleteLocation(Number(params.id))
      return { status: 200, body: { message: result.message } }
    }
  }
}

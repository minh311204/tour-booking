import { Controller, UseGuards } from '@nestjs/common'
import { TsRestHandler } from '@ts-rest/nest'
import { supplierContract } from '../../../shared/contracts/supplier.contract'
import { SupplierService } from './supplier.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @TsRestHandler(supplierContract.getSuppliers)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getSuppliers() {
    return async ({ query }: { query: any }) => {
      const body = await this.supplierService.getSuppliers(query)
      return { status: 200, body }
    }
  }

  @TsRestHandler(supplierContract.getSupplierById)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getSupplierById() {
    return async ({ params }: { params: { id: string } }) => {
      const body = await this.supplierService.getSupplierById(Number(params.id))
      return { status: 200, body }
    }
  }

  @TsRestHandler(supplierContract.createSupplier)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createSupplier() {
    return async ({ body }: { body: any }) => {
      const result = await this.supplierService.createSupplier(body)
      return { status: 201, body: result }
    }
  }

  @TsRestHandler(supplierContract.updateSupplier)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateSupplier() {
    return async ({
      params,
      body,
    }: {
      params: { id: string }
      body: any
    }) => {
      const result = await this.supplierService.updateSupplier(
        Number(params.id),
        body,
      )
      return { status: 200, body: result }
    }
  }

  @TsRestHandler(supplierContract.deleteSupplier)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteSupplier() {
    return async ({ params }: { params: { id: string } }) => {
      const result = await this.supplierService.deleteSupplier(Number(params.id))
      return { status: 200, body: { message: result.message } }
    }
  }
}

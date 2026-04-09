import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prima.service'

type SupplierInput = {
  name: string
  type: 'TRANSPORT' | 'HOTEL' | 'RESTAURANT' | 'GUIDE' | 'ACTIVITY'
  phone?: string
  email?: string
  address?: string
  website?: string
  taxCode?: string
  notes?: string
  isActive?: boolean
}

function formatSupplier(s: {
  id: number
  name: string
  type: 'TRANSPORT' | 'HOTEL' | 'RESTAURANT' | 'GUIDE' | 'ACTIVITY'
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  taxCode: string | null
  notes: string | null
  isActive: boolean
  createdAtUtc: Date | null
}) {
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    phone: s.phone,
    email: s.email,
    address: s.address,
    website: s.website,
    taxCode: s.taxCode,
    notes: s.notes,
    isActive: s.isActive,
    createdAtUtc: s.createdAtUtc?.toISOString() ?? null,
  }
}

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuppliers(query: {
    type?: 'TRANSPORT' | 'HOTEL' | 'RESTAURANT' | 'GUIDE' | 'ACTIVITY'
    isActive?: 'true' | 'false'
    q?: string
    page?: number
    pageSize?: number
  }) {
    const isActive =
      query.isActive === 'true'
        ? true
        : query.isActive === 'false'
          ? false
          : undefined

    const where = {
      ...(query.type ? { type: query.type } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(query.q ? { name: { contains: query.q } } : {}),
    }

    const paginate = query.page != null || query.pageSize != null
    if (paginate) {
      const page = query.page ?? 1
      const pageSize = Math.min(Math.max(query.pageSize ?? 10, 1), 100)
      const [total, rows] = await Promise.all([
        this.prisma.supplier.count({ where }),
        this.prisma.supplier.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])
      return {
        items: rows.map(formatSupplier),
        total,
        page,
        pageSize,
      }
    }

    const rows = await this.prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return rows.map(formatSupplier)
  }

  async getSupplierById(id: number) {
    const s = await this.prisma.supplier.findUnique({ where: { id } })
    if (!s) throw new NotFoundException('Supplier not found')
    return formatSupplier(s)
  }

  async createSupplier(body: SupplierInput) {
    const s = await this.prisma.supplier.create({
      data: {
        name: body.name,
        type: body.type,
        phone: body.phone,
        email: body.email,
        address: body.address,
        website: body.website,
        taxCode: body.taxCode,
        notes: body.notes,
        isActive: body.isActive ?? true,
      },
    })
    return formatSupplier(s)
  }

  async updateSupplier(id: number, body: Partial<SupplierInput>) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Supplier not found')

    const s = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        phone: body.phone,
        email: body.email,
        address: body.address,
        website: body.website,
        taxCode: body.taxCode,
        notes: body.notes,
        isActive: body.isActive,
      },
    })
    return formatSupplier(s)
  }

  async deleteSupplier(id: number) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Supplier not found')
    await this.prisma.supplier.delete({ where: { id } })
    return { message: 'Supplier deleted' }
  }
}

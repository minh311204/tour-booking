import { BadRequestException, Injectable } from '@nestjs/common'
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prima.service'

function num(d: unknown): number {
  if (d == null) return 0
  return Number(d)
}

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0 && cur === 0) return null
  if (prev === 0) return null
  return Math.round(((cur - prev) / prev) * 1000) / 10
}

function ymdUtc(y: number, m0: number, d: number): Date {
  return new Date(Date.UTC(y, m0, d, 0, 0, 0, 0))
}

function endOfDayUtc(y: number, m0: number, d: number): Date {
  return new Date(Date.UTC(y, m0, d, 23, 59, 59, 999))
}

function parseYmd(s: string): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) throw new BadRequestException('Ngày không hợp lệ (YYYY-MM-DD)')
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = ymdUtc(y, mo - 1, d)
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new BadRequestException('Ngày không hợp lệ')
  }
  return { y, m: mo, d }
}

export type DashboardGranularity = 'day' | 'month' | 'year'

export type RevenueSeriesPoint = {
  label: string
  revenueVnd: number
  bookingCount: number
  paymentSuccessCount: number
  /** TT thành công / đơn tạo trong bucket (ước lượng, 0–100%) */
  conversionRatePercent: number
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async bucketStats(
    bucketStart: Date,
    bucketEnd: Date,
  ): Promise<{
    revenueVnd: number
    bookingCount: number
    paymentSuccessCount: number
    conversionRatePercent: number
  }> {
    const [revAgg, bookingCount, paymentSuccessCount] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          paidAtUtc: { gte: bucketStart, lte: bucketEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.booking.count({
        where: {
          bookingDateUtc: { gte: bucketStart, lte: bucketEnd },
        },
      }),
      this.prisma.payment.count({
        where: {
          status: PaymentStatus.SUCCESS,
          paidAtUtc: { gte: bucketStart, lte: bucketEnd },
        },
      }),
    ])
    const revenueVnd = num(revAgg._sum.amount)
    const conversionRatePercent =
      bookingCount > 0
        ? Math.min(
            100,
            Math.round((paymentSuccessCount / bookingCount) * 1000) / 10,
          )
        : 0
    return {
      revenueVnd,
      bookingCount,
      paymentSuccessCount,
      conversionRatePercent,
    }
  }

  async getStats(q: {
    granularity: DashboardGranularity
    start?: string
    end?: string
    year?: string
    yearFrom?: string
    yearTo?: string
  }) {
    const g = q.granularity
    const now = new Date()

    let rangeStart: Date
    let rangeEnd: Date
    const revenueSeries: RevenueSeriesPoint[] = []

    if (g === 'day') {
      const startStr = q.start
      const endStr = q.end
      if (!startStr || !endStr) {
        throw new BadRequestException('Cần start và end (YYYY-MM-DD) khi granularity=day')
      }
      const a = parseYmd(startStr)
      const b = parseYmd(endStr)
      rangeStart = ymdUtc(a.y, a.m - 1, a.d)
      rangeEnd = endOfDayUtc(b.y, b.m - 1, b.d)
      if (rangeEnd < rangeStart) {
        throw new BadRequestException('end phải sau start')
      }
      const maxMs = 93 * 24 * 60 * 60 * 1000
      if (rangeEnd.getTime() - rangeStart.getTime() > maxMs) {
        throw new BadRequestException('Khoảng ngày tối đa 93 ngày')
      }

      let cur = new Date(rangeStart)
      while (cur <= rangeEnd) {
        const y = cur.getUTCFullYear()
        const m = cur.getUTCMonth()
        const d = cur.getUTCDate()
        const ks = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dayStart = ymdUtc(y, m, d)
        const dayEnd = endOfDayUtc(y, m, d)
        const b = await this.bucketStats(dayStart, dayEnd)
        revenueSeries.push({
          label: `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`,
          ...b,
        })
        cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000)
      }
    } else if (g === 'month') {
      const year = q.year != null && q.year !== '' ? Number(q.year) : now.getUTCFullYear()
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        throw new BadRequestException('year không hợp lệ')
      }
      rangeStart = ymdUtc(year, 0, 1)
      rangeEnd = endOfDayUtc(year, 11, 31)

      for (let m0 = 0; m0 < 12; m0++) {
        const ms = ymdUtc(year, m0, 1)
        const me = endOfDayUtc(year, m0, new Date(Date.UTC(year, m0 + 1, 0)).getUTCDate())
        const b = await this.bucketStats(ms, me)
        revenueSeries.push({
          label: `T${m0 + 1}`,
          ...b,
        })
      }
    } else {
      const yf = q.yearFrom != null && q.yearFrom !== '' ? Number(q.yearFrom) : now.getUTCFullYear() - 4
      const yt = q.yearTo != null && q.yearTo !== '' ? Number(q.yearTo) : now.getUTCFullYear()
      if (!Number.isFinite(yf) || !Number.isFinite(yt) || yf > yt || yt - yf > 20) {
        throw new BadRequestException('yearFrom/yearTo không hợp lệ (tối đa 20 năm)')
      }
      rangeStart = ymdUtc(yf, 0, 1)
      rangeEnd = endOfDayUtc(yt, 11, 31)

      for (let y = yf; y <= yt; y++) {
        const ys = ymdUtc(y, 0, 1)
        const ye = endOfDayUtc(y, 11, 31)
        const b = await this.bucketStats(ys, ye)
        revenueSeries.push({
          label: String(y),
          ...b,
        })
      }
    }

    const payWhere: Prisma.PaymentWhereInput = {
      status: PaymentStatus.SUCCESS,
      paidAtUtc: { gte: rangeStart, lte: rangeEnd },
    }

    const durationMs = rangeEnd.getTime() - rangeStart.getTime()
    const prevRangeEnd = new Date(rangeStart.getTime() - 1)
    const prevRangeStart = new Date(prevRangeEnd.getTime() - durationMs)

    const payWherePrev: Prisma.PaymentWhereInput = {
      status: PaymentStatus.SUCCESS,
      paidAtUtc: { gte: prevRangeStart, lte: prevRangeEnd },
    }

    const [
      revAgg,
      bookingCount,
      newUsers,
      nonCancelled,
      completed,
      pendingSnap,
      revPrevAgg,
      bookingPrev,
      usersPrev,
      statusGroups,
      heatRows,
      supplierByType,
      regionRows,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: payWhere,
        _sum: { amount: true },
      }),
      this.prisma.booking.count({
        where: {
          bookingDateUtc: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAtUtc: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      this.prisma.booking.count({
        where: {
          bookingDateUtc: { gte: rangeStart, lte: rangeEnd },
          status: { not: BookingStatus.CANCELLED },
        },
      }),
      this.prisma.booking.count({
        where: {
          bookingDateUtc: { gte: rangeStart, lte: rangeEnd },
          status: BookingStatus.COMPLETED,
        },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.PENDING },
      }),
      this.prisma.payment.aggregate({
        where: payWherePrev,
        _sum: { amount: true },
      }),
      this.prisma.booking.count({
        where: {
          bookingDateUtc: { gte: prevRangeStart, lte: prevRangeEnd },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAtUtc: { gte: prevRangeStart, lte: prevRangeEnd },
        },
      }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where: {
          bookingDateUtc: { gte: rangeStart, lte: rangeEnd },
        },
        _count: { id: true },
      }),
      this.prisma.$queryRaw<Array<{ dow: number; c: bigint }>>`
        SELECT DAYOFWEEK(bookingDateUtc) AS dow, COUNT(*) AS c
        FROM Booking
        WHERE bookingDateUtc >= ${rangeStart} AND bookingDateUtc <= ${rangeEnd}
        GROUP BY DAYOFWEEK(bookingDateUtc)
      `,
      this.prisma.supplier.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      this.prisma.booking.findMany({
        where: {
          bookingDateUtc: { gte: rangeStart, lte: rangeEnd },
        },
        select: {
          schedule: {
            select: {
              tour: {
                select: {
                  destinationLocation: {
                    select: {
                      province: {
                        select: {
                          region: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ])

    const totalRev = num(revAgg._sum.amount)
    const totalRevPrev = num(revPrevAgg._sum.amount)

    const bookingStatusBreakdown: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    }
    for (const row of statusGroups) {
      bookingStatusBreakdown[row.status] = row._count.id
    }

    const dowLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    const heatmapCounts = [0, 0, 0, 0, 0, 0, 0]
    for (const row of heatRows) {
      const mysqlDow = Number(row.dow)
      const idx = mysqlDow === 1 ? 6 : mysqlDow - 2
      if (idx >= 0 && idx < 7) {
        heatmapCounts[idx] = Number(row.c)
      }
    }
    const heatmapWeekday = heatmapCounts.map((count, i) => ({
      label: dowLabels[i] ?? `D${i}`,
      count,
    }))

    const regionMap = new Map<string, number>()
    for (const b of regionRows) {
      const name =
        b.schedule?.tour?.destinationLocation?.province?.region?.name?.trim() ||
        'Khác'
      regionMap.set(name, (regionMap.get(name) ?? 0) + 1)
    }
    const toursByRegion = [...regionMap.entries()]
      .map(([regionName, bookingCount]) => ({ regionName, bookingCount }))
      .sort((a, b) => b.bookingCount - a.bookingCount)

    const supplierCountByType = supplierByType.map((s) => ({
      type: s.type,
      count: s._count.id,
    }))

    const completionRatePercent =
      nonCancelled > 0 ? Math.round((completed / nonCancelled) * 1000) / 10 : null

    const topRows = await this.prisma.booking.groupBy({
      by: ['tourScheduleId'],
      where: {
        bookingDateUtc: { gte: rangeStart, lte: rangeEnd },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const scheduleIds = topRows.map((r) => r.tourScheduleId)
    const schedules =
      scheduleIds.length === 0
        ? []
        : await this.prisma.tourSchedule.findMany({
            where: { id: { in: scheduleIds } },
            select: {
              id: true,
              tour: { select: { id: true, name: true } },
            },
          })
    const schedMap = new Map(schedules.map((s) => [s.id, s]))

    const topTours = topRows.map((r) => {
      const s = schedMap.get(r.tourScheduleId)
      return {
        tourId: s?.tour.id ?? 0,
        tourName: s?.tour.name ?? `#${r.tourScheduleId}`,
        bookingCount: r._count.id,
      }
    })

    return {
      range: {
        startUtc: rangeStart.toISOString(),
        endUtc: rangeEnd.toISOString(),
      },
      granularity: g,
      summary: {
        totalRevenueVnd: totalRev,
        bookingCount,
        newUsersCount: newUsers,
        pendingBookingsCount: pendingSnap,
        completionRatePercent,
      },
      comparison: {
        prevRange: {
          startUtc: prevRangeStart.toISOString(),
          endUtc: prevRangeEnd.toISOString(),
        },
        revenueChangePercent: pctChange(totalRev, totalRevPrev),
        bookingChangePercent: pctChange(bookingCount, bookingPrev),
        usersChangePercent: pctChange(newUsers, usersPrev),
        totalRevenuePrevVnd: totalRevPrev,
        bookingCountPrev: bookingPrev,
        newUsersPrev: usersPrev,
      },
      revenueSeries,
      bookingStatusBreakdown,
      heatmapWeekday,
      toursByRegion,
      supplierCountByType,
      topTours,
    }
  }
}

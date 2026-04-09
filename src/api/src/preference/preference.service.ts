import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prima.service'

type UpsertPreferenceInput = {
  preferredLocations?: string | null
  budgetRange?: string | null
  travelStyle?: string | null
}

function mapTour(t: any) {
  return {
    id: t.id,
    departureLocationId: t.departureLocationId,
    destinationLocationId: t.destinationLocationId,
    name: t.name,
    slug: t.slug ?? null,
    description: t.description ?? null,
    durationDays: t.durationDays ?? null,
    basePrice: t.basePrice ? Number(t.basePrice) : null,
    maxPeople: t.maxPeople ?? null,
    thumbnailUrl: t.thumbnailUrl ?? null,
    ratingAvg: t.ratingAvg ?? null,
    totalReviews: t.totalReviews ?? null,
    tourLine: t.tourLine ?? null,
    transportType: t.transportType ?? null,
    isActive: t.isActive ?? null,
    createdAtUtc: t.createdAtUtc ? t.createdAtUtc.toISOString() : null,
    departureLocation: t.departureLocation ?? undefined,
    destinationLocation: t.destinationLocation ?? undefined,
  }
}

const tourSelect = {
  id: true,
  departureLocationId: true,
  destinationLocationId: true,
  name: true,
  slug: true,
  description: true,
  durationDays: true,
  basePrice: true,
  maxPeople: true,
  thumbnailUrl: true,
  ratingAvg: true,
  totalReviews: true,
  tourLine: true,
  transportType: true,
  isActive: true,
  createdAtUtc: true,
  departureLocation: { select: { id: true, name: true } },
  destinationLocation: { select: { id: true, name: true } },
}

@Injectable()
export class PreferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyPreference(userId: number) {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId },
    })
    if (!pref) return null
    return {
      id: pref.id,
      userId: pref.userId,
      preferredLocations: pref.preferredLocations ?? null,
      budgetRange: pref.budgetRange ?? null,
      travelStyle: pref.travelStyle ?? null,
    }
  }

  async upsertMyPreference(userId: number, data: UpsertPreferenceInput) {
    const pref = await this.prisma.userPreference.upsert({
      where: { userId },
      update: {
        preferredLocations: data.preferredLocations ?? undefined,
        budgetRange: data.budgetRange ?? undefined,
        travelStyle: data.travelStyle ?? undefined,
      },
      create: {
        userId,
        preferredLocations: data.preferredLocations ?? null,
        budgetRange: data.budgetRange ?? null,
        travelStyle: data.travelStyle ?? null,
      },
    })
    return {
      id: pref.id,
      userId: pref.userId,
      preferredLocations: pref.preferredLocations ?? null,
      budgetRange: pref.budgetRange ?? null,
      travelStyle: pref.travelStyle ?? null,
    }
  }

  async trackBehavior(userId: number, tourId: number, action: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      select: { id: true },
    })
    if (!tour) throw new NotFoundException('Tour not found')

    const behavior = await this.prisma.userBehavior.create({
      data: { userId, tourId, action },
    })
    return {
      id: behavior.id,
      userId: behavior.userId,
      tourId: behavior.tourId,
      action: behavior.action,
      createdAtUtc: behavior.createdAtUtc
        ? behavior.createdAtUtc.toISOString()
        : null,
    }
  }

  async getMyBehaviors(
    userId: number,
    opts: { action?: string; limit?: number },
  ) {
    const rows = await this.prisma.userBehavior.findMany({
      where: {
        userId,
        ...(opts.action ? { action: opts.action } : {}),
      },
      orderBy: { createdAtUtc: 'desc' },
      take: opts.limit ?? 50,
    })
    return rows.map((b) => ({
      id: b.id,
      userId: b.userId,
      tourId: b.tourId,
      action: b.action,
      createdAtUtc: b.createdAtUtc ? b.createdAtUtc.toISOString() : null,
    }))
  }

  /**
   * Gợi ý tour dựa trên hành vi: lấy các tour user đã xem/yêu thích nhiều,
   * sau đó tìm tour tương tự theo điểm đến, tag, tourLine.
   * Đây là recommendation đơn giản dựa trên collaborative filtering thủ công.
   */
  async getRecommendations(userId: number, limit = 10) {
    // Lấy top tourId user đã tương tác (view, wishlist, book)
    const behaviors = await this.prisma.userBehavior.findMany({
      where: { userId, action: { in: ['view', 'wishlist', 'book'] } },
      orderBy: { createdAtUtc: 'desc' },
      take: 30,
      select: { tourId: true },
    })

    const interactedTourIds = [...new Set(behaviors.map((b) => b.tourId))]

    if (interactedTourIds.length === 0) {
      // Cold start: trả về tour hot nhất (ratingAvg cao nhất)
      const hotTours = await this.prisma.tour.findMany({
        where: { isActive: true },
        orderBy: [{ ratingAvg: 'desc' }, { totalReviews: 'desc' }],
        take: limit,
        select: tourSelect,
      })
      return hotTours.map(mapTour)
    }

    // Lấy thông tin về các tour đã tương tác (điểm đến, tourLine)
    const interactedTours = await this.prisma.tour.findMany({
      where: { id: { in: interactedTourIds } },
      select: {
        destinationLocationId: true,
        tourLine: true,
      },
    })

    const destIds = [...new Set(interactedTours.map((t) => t.destinationLocationId))]
    const tourLines = [...new Set(interactedTours.map((t) => t.tourLine).filter(Boolean))]

    // Tìm tour tương tự chưa tương tác
    const recommended = await this.prisma.tour.findMany({
      where: {
        isActive: true,
        id: { notIn: interactedTourIds },
        OR: [
          { destinationLocationId: { in: destIds } },
          ...(tourLines.length > 0 ? [{ tourLine: { in: tourLines as any } }] : []),
        ],
      },
      orderBy: [{ ratingAvg: 'desc' }, { totalReviews: 'desc' }],
      take: limit,
      select: tourSelect,
    })

    // Nếu không đủ, bổ sung tour phổ biến
    if (recommended.length < limit) {
      const extra = await this.prisma.tour.findMany({
        where: {
          isActive: true,
          id: {
            notIn: [
              ...interactedTourIds,
              ...recommended.map((t) => t.id),
            ],
          },
        },
        orderBy: [{ ratingAvg: 'desc' }, { totalReviews: 'desc' }],
        take: limit - recommended.length,
        select: tourSelect,
      })
      return [...recommended, ...extra].map(mapTour)
    }

    return recommended.map(mapTour)
  }
}

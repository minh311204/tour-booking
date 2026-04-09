import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prima.service'

type UpsertTourReviewInput = {
  tourId: number
  userId: number
  rating: number
  comment: string | null
}

@Injectable()
export class TourReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async listReviews(tourId: number) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      select: { id: true },
    })
    if (!tour) throw new NotFoundException('Tour not found')

    const rows = await this.prisma.review.findMany({
      where: { tourId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAtUtc: 'desc' },
    })

    return rows.map((r) => ({
      id: r.id,
      tourId: r.tourId,
      userId: r.userId,
      rating: r.rating,
      comment: r.comment ?? null,
      createdAtUtc: r.createdAtUtc ? r.createdAtUtc.toISOString() : null,
      user: {
        id: r.user.id,
        firstName: r.user.firstName ?? null,
        lastName: r.user.lastName ?? null,
      },
    }))
  }

  private async assertUserCanReview(input: UpsertTourReviewInput) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        userId: input.userId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        schedule: {
          tourId: input.tourId,
          endDate: { lt: new Date() },
        },
      },
      select: { id: true },
    })

    if (!booking) {
      throw new ForbiddenException(
        'Bạn chỉ có thể đánh giá sau khi đã tham gia tour (booking đã xác nhận/hoàn tất và lịch đã kết thúc)',
      )
    }
  }

  async deleteReview(userId: number, tourId: number) {
    const tourExists = await this.prisma.tour.findUnique({
      where: { id: tourId },
      select: { id: true },
    })
    if (!tourExists) throw new NotFoundException('Tour not found')

    const review = await this.prisma.review.findUnique({
      where: { userId_tourId: { userId, tourId } },
    })
    if (!review) throw new NotFoundException('Bạn chưa có đánh giá cho tour này')

    const tour = await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { userId_tourId: { userId, tourId } },
      })

      const agg = await tx.review.aggregate({
        where: { tourId },
        _avg: { rating: true },
        _count: { _all: true },
      })

      const ratingAvg = agg._avg.rating ?? null
      const totalReviews = agg._count._all || null

      return tx.tour.update({
        where: { id: tourId },
        data: { ratingAvg, totalReviews },
        select: { ratingAvg: true, totalReviews: true },
      })
    })

    return {
      message: 'Đã xoá đánh giá',
      tour: { ratingAvg: tour.ratingAvg ?? null, totalReviews: tour.totalReviews ?? null },
    }
  }

  async upsertReview(input: UpsertTourReviewInput) {
    const trimmedComment = input.comment?.trim() ?? null

    const tourExists = await this.prisma.tour.findUnique({
      where: { id: input.tourId },
      select: { id: true },
    })
    if (!tourExists) throw new NotFoundException('Tour not found')

    await this.assertUserCanReview(input)

    const result = await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: {
          userId_tourId: {
            userId: input.userId,
            tourId: input.tourId,
          },
        },
        update: {
          rating: input.rating,
          comment: trimmedComment,
        },
        create: {
          userId: input.userId,
          tourId: input.tourId,
          rating: input.rating,
          comment: trimmedComment,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      const agg = await tx.review.aggregate({
        where: { tourId: input.tourId },
        _avg: { rating: true },
        _count: { _all: true },
      })

      const ratingAvg = agg._avg.rating ?? null
      const totalReviews = agg._count._all ? agg._count._all : null

      await tx.tour.update({
        where: { id: input.tourId },
        data: {
          ratingAvg,
          totalReviews,
        },
      })

      return {
        review: {
          id: review.id,
          tourId: review.tourId,
          userId: review.userId,
          rating: review.rating,
          comment: review.comment ?? null,
          createdAtUtc: review.createdAtUtc
            ? review.createdAtUtc.toISOString()
            : null,
          user: {
            id: review.user.id,
            firstName: review.user.firstName ?? null,
            lastName: review.user.lastName ?? null,
          },
        },
        tour: { ratingAvg, totalReviews },
      }
    })

    return result
  }
}


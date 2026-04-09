import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prima.service'

@Injectable()
export class TourMediaService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertTourExists(tourId: number) {
    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } })
    if (!tour) {
      throw new NotFoundException('Tour not found')
    }
  }

  async addImage(
    tourId: number,
    data: { imageUrl: string; isThumbnail?: boolean },
  ) {
    await this.assertTourExists(tourId)
    const row = await this.prisma.tourImage.create({
      data: {
        tourId,
        imageUrl: data.imageUrl,
        isThumbnail: data.isThumbnail ?? false,
      },
    })
    return {
      id: row.id,
      tourId: row.tourId,
      imageUrl: row.imageUrl,
      isThumbnail: row.isThumbnail,
    }
  }

  async removeImage(tourId: number, imageId: number) {
    const row = await this.prisma.tourImage.findFirst({
      where: { id: imageId, tourId },
    })
    if (!row) {
      throw new NotFoundException('Image not found')
    }
    await this.prisma.tourImage.delete({ where: { id: imageId } })
    return { message: 'Image removed' }
  }

  async addVideo(tourId: number, data: { videoUrl: string }) {
    await this.assertTourExists(tourId)
    const row = await this.prisma.tourVideo.create({
      data: { tourId, videoUrl: data.videoUrl },
    })
    return {
      id: row.id,
      tourId: row.tourId,
      videoUrl: row.videoUrl,
    }
  }

  async removeVideo(tourId: number, videoId: number) {
    const row = await this.prisma.tourVideo.findFirst({
      where: { id: videoId, tourId },
    })
    if (!row) {
      throw new NotFoundException('Video not found')
    }
    await this.prisma.tourVideo.delete({ where: { id: videoId } })
    return { message: 'Video removed' }
  }
}

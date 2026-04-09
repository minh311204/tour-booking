import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prima.service'

@Injectable()
export class TourTagService {
  constructor(private readonly prisma: PrismaService) {}

  async getTags() {
    const tags = await this.prisma.tourTag.findMany({
      orderBy: { name: 'asc' },
    })
    return tags.map((t) => ({ id: t.id, name: t.name }))
  }

  async createTag(name: string) {
    const tag = await this.prisma.tourTag.create({
      data: { name: name.trim() },
    })
    return { id: tag.id, name: tag.name }
  }

  async assertTagsExist(tagIds: number[]) {
    if (!tagIds.length) return
    const found = await this.prisma.tourTag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true },
    })
    if (found.length !== tagIds.length) {
      throw new NotFoundException('One or more tags not found')
    }
  }
}

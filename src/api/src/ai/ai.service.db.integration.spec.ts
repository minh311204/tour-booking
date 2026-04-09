/**
 * Integration: AiService + DB thật (MariaDB/MySQL qua Prisma).
 *
 * Chạy khi có DATABASE_URL (vd. trong src/api/.env):
 *   npx jest api/src/ai/ai.service.db.integration.spec.ts
 *
 * Không có DB → toàn bộ suite được skip (không fail CI).
 */
import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), 'src/api/.env') })

import { PrismaService } from '../prisma/prima.service'
import { AiService } from './ai.service'

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

const dbDescribe = hasDatabaseUrl ? describe : describe.skip

dbDescribe('AiService — integration (dữ liệu DB thật)', () => {
  let prisma: PrismaService
  let ai: AiService
  let prevOpenAi: string | undefined

  beforeAll(async () => {
    prevOpenAi = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    prisma = new PrismaService()
    await prisma.$connect()
    ai = new AiService(prisma)
  })

  afterAll(async () => {
    if (prevOpenAi !== undefined) process.env.OPENAI_API_KEY = prevOpenAi
    await prisma.$disconnect()
  })

  /** Mỗi tour trong response phải trùng name/slug với bản ghi DB */
  async function expectToursMatchDatabase(
    tours: { id: number; name: string; slug: string | null }[] | undefined,
  ) {
    expect(tours).toBeDefined()
    expect(tours!.length).toBeGreaterThan(0)
    for (const t of tours!) {
      const row = await prisma.tour.findUnique({
        where: { id: t.id },
        select: { id: true, name: true, slug: true, isActive: true },
      })
      expect(row).not.toBeNull()
      expect(row!.isActive).toBe(true)
      expect(row!.name).toBe(t.name)
      expect(row!.slug ?? null).toBe(t.slug ?? null)
    }
  }

  it('có tour active + lịch tương lai: gửi "Muốn đi <điểm đến>" → tours[] là bản ghi trong DB', async () => {
    const now = new Date()
    const seedTour = await prisma.tour.findFirst({
      where: {
        isActive: true,
        schedules: { some: { startDate: { gte: now } } },
      },
      include: {
        destinationLocation: { select: { name: true } },
        schedules: {
          where: { startDate: { gte: now } },
          orderBy: { startDate: 'asc' },
          take: 1,
        },
      },
    })

    if (!seedTour?.destinationLocation?.name) {
      throw new Error('DB không có tour active với lịch khởi hành tương lai — seed hoặc thêm schedule.')
    }

    const destName = seedTour.destinationLocation!.name.trim()
    const keyword = destName.split(/\s+/)[0] ?? destName

    const res = await ai.sendMessage({
      userId: null,
      message: `Muốn đi ${keyword}`,
    })

    expect(res.reply.length).toBeGreaterThan(10)
    await expectToursMatchDatabase(res.tours as { id: number; name: string; slug: string | null }[])

    const ids = new Set((res.tours ?? []).map((t) => t.id))
    expect(ids.has(seedTour.id)).toBe(true)
  })

  it('có tour: gửi "Tour <đoạn trong tên tour>" → tours[] khớp DB', async () => {
    const now = new Date()
    const seedTour = await prisma.tour.findFirst({
      where: {
        isActive: true,
        schedules: { some: { startDate: { gte: now } } },
      },
      select: { id: true, name: true },
    })

    if (!seedTour?.name || seedTour.name.length < 8) {
      throw new Error('Cần ít nhất một tour có tên đủ dài để làm từ khóa tìm kiếm.')
    }

    const words = seedTour.name.split(/\s+/).filter((w) => w.length >= 3)
    const hint = words[Math.min(1, words.length - 1)] ?? words[0]

    const res = await ai.sendMessage({
      userId: null,
      message: `Tour ${hint}`,
    })

    await expectToursMatchDatabase(res.tours as { id: number; name: string; slug: string | null }[])
    const ids = (res.tours ?? []).map((t) => t.id)
    expect(ids).toContain(seedTour.id)
  })

  it('FAQ thanh toán → chỉ có reply, không có tours', async () => {
    const res = await ai.sendMessage({
      userId: null,
      message: 'Thanh toán VNPay như thế nào?',
    })

    expect(res.reply).toContain('VNPay')
    expect(res.tours).toBeUndefined()
  })
})

import { AiService } from './ai.service'
import * as llm from './llm'

jest.mock('./llm', () => {
  const actual = jest.requireActual<typeof import('./llm')>('./llm')
  return {
    ...actual,
    extractSlotsWithLlm: jest.fn(),
    isLlmEnabled: jest.fn(() => false),
    isNaturalReplyEnabled: jest.fn(() => false),
    generateRecommendationReplyNatural: jest.fn().mockResolvedValue(null),
  }
})

/** 1 bản ghi tour tối thiểu cho mock Prisma (searchTours / getTrending) */
function mockTourRow(overrides: Record<string, unknown> = {}) {
  const future = new Date(Date.now() + 86400000)
  return {
    id: 1,
    departureLocationId: 1,
    destinationLocationId: 2,
    name: 'Tour mock',
    slug: 'tour-mock',
    description: null,
    durationDays: 3,
    basePrice: 3_000_000,
    maxPeople: 20,
    thumbnailUrl: null,
    ratingAvg: 4.5,
    totalReviews: 10,
    tourLine: 'STANDARD',
    transportType: 'BUS',
    isActive: true,
    createdAtUtc: new Date(),
    departureLocation: { id: 1, name: 'TP.HCM' },
    destinationLocation: { id: 2, name: 'Đà Lạt' },
    schedules: [{ startDate: future, availableSeats: 10, bookedSeats: 0 }],
    ...overrides,
  }
}

describe('AiService.sendMessage', () => {
  const extractSlotsWithLlm = llm.extractSlotsWithLlm as jest.MockedFunction<typeof llm.extractSlotsWithLlm>
  const isLlmEnabled = llm.isLlmEnabled as jest.MockedFunction<typeof llm.isLlmEnabled>

  let service: AiService
  let prisma: {
    chatSession: { findFirst: jest.Mock; create: jest.Mock }
    chatMessage: { create: jest.Mock; findMany: jest.Mock }
    tour: { findMany: jest.Mock }
    booking: { findMany: jest.Mock }
    location: { findMany: jest.Mock }
    userBehavior: { createMany: jest.Mock }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    isLlmEnabled.mockReturnValue(false)
    extractSlotsWithLlm.mockResolvedValue(null)

    prisma = {
      chatSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      chatMessage: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      tour: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      location: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      userBehavior: {
        createMany: jest.fn(),
      },
    }

    service = new AiService(prisma as any)
  })

  async function mockGuestSession(id = 1, sessionKey = 'guest-session-key-01') {
    prisma.chatSession.findFirst.mockResolvedValue({ id, userId: null, sessionKey })
    return { id, sessionKey }
  }

  async function mockUserSession(userId: number, sessionId = 1) {
    prisma.chatSession.findFirst.mockResolvedValue({ id: sessionId, userId, sessionKey: null })
    return { sessionId, userId }
  }

  describe('FAQ — trả lời cố định, không search tour', () => {
  it('trả lời FAQ khi khớp từ khóa, không gọi gợi ý tour', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Tôi muốn hủy tour thì sao?',
    })

    expect(res.reply).toContain('Tùy từng tour')
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })

  it('Case: "Thanh toán qua VNPay được không?" → FAQ thanh toán', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Thanh toán qua VNPay được không?',
    })
    expect(res.reply).toContain('VNPay')
    expect(res.reply).toContain('chuyển khoản')
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })

  it('Case: "Cần mang giấy tờ gì?" → FAQ giấy tờ', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Cần mang giấy tờ gì?',
    })
    expect(res.reply).toMatch(/CCCD|CMND|hộ chiếu/i)
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })

  it('Case: "Đặt cọc bao nhiêu phần trăm?" → FAQ cọc', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Đặt cọc bao nhiêu phần trăm?',
    })
    expect(res.reply).toMatch(/30|50|%/)
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })
  })

  describe('FAQ — không nhầm với tên địa danh / tour', () => {
  it('bảo hiểm du lịch → FAQ (không kích hoạt list tour vì cụm du lịch)', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Bảo hiểm du lịch có bắt buộc không ạ?',
    })

    expect(res.reply).toMatch(/bảo hiểm|Tùy gói/i)
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })
  })

  describe('Chào hỏi & xã giao', () => {
  it('tin nhắn xã giao ngắn (cảm ơn) → không ép gợi ý tour', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Cảm ơn bạn nhé',
    })

    expect(res.reply).toContain('điểm đến')
    expect(res.tours).toBeUndefined()
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })

  it('Case: "Ok cảm ơn" → fallback hỏi thêm, không search', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Ok cảm ơn',
    })
    expect(res.reply).toContain('điểm đến')
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })

  it('chào hỏi → chưa gợi ý tour', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Xin chào',
    })

    expect(res.reply).toContain('Chào bạn')
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })
  })

  describe('Fallback — không đủ tín hiệu tìm tour', () => {
  it('Case: chỉ gửi mã "BK-17" → hỏi điểm đến/ngày/ngân sách, không search', async () => {
    await mockGuestSession()
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'BK-17',
    })
    expect(res.reply).toContain('điểm đến')
    expect(res.reply).toContain('ngân sách')
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
  })
  })

  describe('Gợi ý tour — khách (userId null)', () => {
  it('"Tôi muốn đi Hà Nội" → gợi ý tour (không LLM)', async () => {
    await mockGuestSession()
    prisma.tour.findMany.mockResolvedValueOnce([
      mockTourRow({
        id: 1,
        name: 'Tour Hà Nội',
        slug: 'ha-noi',
        durationDays: 2,
        basePrice: 3000000,
        maxPeople: 30,
        ratingAvg: 4.2,
        totalReviews: 5,
        departureLocation: { id: 1, name: 'Hà Nội' },
        destinationLocation: { id: 2, name: 'Ninh Bình' },
      }),
    ])

    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Tôi muốn đi Hà Nội',
    })

    expect(prisma.tour.findMany).toHaveBeenCalled()
    expect(res.reply).toMatch(/Hà Nội|hà nội|tìm thấy|phù hợp|tham khảo/i)
  })

  it('Case: "Tour Đà Nẵng 4 ngày" → search (từ Tour + số ngày)', async () => {
    await mockGuestSession()
    prisma.tour.findMany.mockResolvedValueOnce([mockTourRow({ id: 11, name: 'Đà Nẵng 4N3Đ', durationDays: 4 })])
    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Tour Đà Nẵng 4 ngày',
    })
    expect(prisma.tour.findMany).toHaveBeenCalled()
    expect(res.tours?.length).toBeGreaterThan(0)
    expect(res.reply).toMatch(/tìm thấy|tham khảo|phù hợp/i)
  })

  it('tên tour dài (có Hoàng) → không nhầm FAQ chính sách hủy', async () => {
    await mockGuestSession()
    prisma.tour.findMany.mockResolvedValueOnce([
      mockTourRow({
        id: 2,
        name: 'Hà Nội – Hoàng Thành – Hạ Long',
        slug: 'hn-hl',
        basePrice: 4000000,
        ratingAvg: 4.5,
        totalReviews: 3,
        departureLocation: { id: 1, name: 'Hà Nội' },
        destinationLocation: { id: 2, name: 'Quảng Ninh' },
        schedules: [{ startDate: new Date(Date.now() + 86400000), availableSeats: 5, bookedSeats: 0 }],
      }),
    ])

    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Hà Nội – Hoàng Thành Thăng Long – Chùa Bái Đính – Tràng An – Vịnh Hạ Long',
    })

    expect(res.reply).not.toContain('Tùy từng tour và thời điểm hủy/đổi')
    expect(prisma.tour.findMany).toHaveBeenCalled()
  })

  it('có từ khóa miền + số ngày → gọi tìm tour', async () => {
    await mockGuestSession()
    prisma.tour.findMany.mockResolvedValueOnce([mockTourRow({ id: 9, name: 'Tour test', slug: 'tour-test' })])

    const res = await service.sendMessage({
      userId: null,
      sessionId: 1,
      sessionKey: 'guest-session-key-01',
      message: 'Gợi ý tour miền nam 3 ngày',
    })

    expect(prisma.tour.findMany).toHaveBeenCalled()
    expect(res.tours?.length).toBeGreaterThan(0)
    expect(res.reply).toMatch(/tìm thấy|tham khảo|phù hợp/i)
  })
  })

  describe('User đã đăng nhập (userId có giá trị)', () => {
  it('Case: có điểm đến "Muốn đi Huế" → search tour + ghi nhận chat_recommendation', async () => {
    await mockUserSession(42, 1)
    prisma.tour.findMany.mockResolvedValueOnce([mockTourRow({ id: 7, name: 'Huế 3 ngày', destinationLocation: { id: 2, name: 'Huế' } })])
    const res = await service.sendMessage({
      userId: 42,
      sessionId: 1,
      message: 'Muốn đi Huế',
    })
    expect(prisma.tour.findMany).toHaveBeenCalled()
    expect(res.tours?.length).toBeGreaterThan(0)
    expect(prisma.userBehavior.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ userId: 42, tourId: 7, action: 'chat_recommendation' })]),
      }),
    )
  })

  it('Case: FAQ bảo hiểm khi đã login → vẫn FAQ, không search', async () => {
    await mockUserSession(42, 1)
    const res = await service.sendMessage({
      userId: 42,
      sessionId: 1,
      message: 'Bảo hiểm du lịch có bắt buộc không?',
    })
    expect(res.reply).toMatch(/bảo hiểm|Tùy gói/i)
    expect(prisma.tour.findMany).not.toHaveBeenCalled()
    expect(prisma.userBehavior.createMany).not.toHaveBeenCalled()
  })
  })

  describe('khi bật LLM', () => {
    beforeEach(() => {
      isLlmEnabled.mockReturnValue(true)
    })

    it('userIntent other → từ chối nhẹ, không search tour', async () => {
      await mockGuestSession()
      extractSlotsWithLlm.mockResolvedValue({ userIntent: 'other' })

      const res = await service.sendMessage({
        userId: null,
        sessionId: 1,
        sessionKey: 'guest-session-key-01',
        message: '2 cộng 2 bằng mấy',
      })

      expect(res.reply).toContain('chỉ hỗ trợ')
      expect(prisma.tour.findMany).not.toHaveBeenCalled()
    })

    it('userIntent faq → trả lời gợi ý chủ đề khi không khớp keyword rule', async () => {
      await mockGuestSession()
      extractSlotsWithLlm.mockResolvedValue({ userIntent: 'faq' })

      const res = await service.sendMessage({
        userId: null,
        sessionId: 1,
        sessionKey: 'guest-session-key-01',
        message: 'Thuế tại sân bay quốc tế tính thế nào?',
      })

      expect(res.reply).toMatch(/chính sách hủy|VNPay|giấy tờ|thanh toán/i)
      expect(prisma.tour.findMany).not.toHaveBeenCalled()
    })
  })
})

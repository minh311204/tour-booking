import OpenAI from 'openai'

export type LlmExtractedSlots = {
  destination?: string
  departure?: string
  days?: number
  budgetMin?: number
  budgetMax?: number
  adults?: number
  children?: number
  infants?: number
  transportType?: 'BUS' | 'FLIGHT' | 'MIXED'
  tourLine?: 'PREMIUM' | 'STANDARD' | 'ECONOMY' | 'GOOD_VALUE'
  keywords?: string[]
  userIntent?: 'recommend' | 'faq' | 'booking' | 'other'
}

/** Schema strict cho OpenAI Structured Outputs (json_schema) */
const SLOT_EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    userIntent: {
      type: 'string',
      enum: ['recommend', 'faq', 'booking', 'other'],
      description: 'Ý định chính của tin nhắn mới (ưu tiên ngữ cảnh du lịch/đặt tour).',
    },
    destination: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Điểm đến nếu có; không đoán bừa.',
    },
    departure: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Nơi khởi hành nếu có.',
    },
    days: {
      anyOf: [{ type: 'number' }, { type: 'null' }],
      description: 'Số ngày tour nếu người dùng nêu rõ.',
    },
    budgetMin: {
      anyOf: [{ type: 'number' }, { type: 'null' }],
      description: 'Ngân sách tối thiểu VND.',
    },
    budgetMax: {
      anyOf: [{ type: 'number' }, { type: 'null' }],
      description: 'Ngân sách tối đa VND.',
    },
    adults: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    children: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    infants: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    transportType: {
      anyOf: [{ type: 'string', enum: ['BUS', 'FLIGHT', 'MIXED'] }, { type: 'null' }],
    },
    tourLine: {
      anyOf: [
        { type: 'string', enum: ['PREMIUM', 'STANDARD', 'ECONOMY', 'GOOD_VALUE'] },
        { type: 'null' },
      ],
    },
    keywords: {
      anyOf: [
        { type: 'array', items: { type: 'string' }, maxItems: 8 },
        { type: 'null' },
      ],
      description: 'Từ khóa tìm kiếm tour, không trùng destination.',
    },
  },
  required: [
    'userIntent',
    'destination',
    'departure',
    'days',
    'budgetMin',
    'budgetMax',
    'adults',
    'children',
    'infants',
    'transportType',
    'tourLine',
    'keywords',
  ],
} as const

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

export function isLlmEnabled() {
  return !!process.env.OPENAI_API_KEY
}

/** Bật sinh câu trả lời tự nhiên (B): cần API key; tắt: OPENAI_NATURAL_REPLY=0 */
export function isNaturalReplyEnabled() {
  return isLlmEnabled() && process.env.OPENAI_NATURAL_REPLY !== '0'
}

function nullToUndefined<T>(v: T | null | undefined): T | undefined {
  if (v === null || v === undefined) return undefined
  return v
}

function parseSlotsPayload(raw: Record<string, unknown>): LlmExtractedSlots {
  const out: LlmExtractedSlots = {
    userIntent: raw.userIntent as LlmExtractedSlots['userIntent'],
  }
  const d = nullToUndefined(raw.destination as string | null)
  if (d) out.destination = d
  const dep = nullToUndefined(raw.departure as string | null)
  if (dep) out.departure = dep
  const days = nullToUndefined(raw.days as number | null)
  if (days != null) out.days = days
  const bmin = nullToUndefined(raw.budgetMin as number | null)
  if (bmin != null) out.budgetMin = bmin
  const bmax = nullToUndefined(raw.budgetMax as number | null)
  if (bmax != null) out.budgetMax = bmax
  const a = nullToUndefined(raw.adults as number | null)
  if (a != null) out.adults = a
  const c = nullToUndefined(raw.children as number | null)
  if (c != null) out.children = c
  const i = nullToUndefined(raw.infants as number | null)
  if (i != null) out.infants = i
  const tt = nullToUndefined(raw.transportType as string | null)
  if (tt === 'BUS' || tt === 'FLIGHT' || tt === 'MIXED') out.transportType = tt
  const tl = nullToUndefined(raw.tourLine as string | null)
  if (tl === 'PREMIUM' || tl === 'STANDARD' || tl === 'ECONOMY' || tl === 'GOOD_VALUE') out.tourLine = tl
  const kw = raw.keywords as string[] | null | undefined
  if (kw && kw.length > 0) out.keywords = kw
  return out
}

async function extractSlotsWithLlmStructured(client: OpenAI, input: {
  message: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
}): Promise<LlmExtractedSlots | null> {
  const system = [
    'Bạn là trợ lý trích xuất thông tin cho hệ thống gợi ý tour du lịch Việt Nam.',
    'Chỉ điền field khi có trong hội thoại; không bịa địa danh hay số tiền. Dùng null cho field không chắc.',
    'userIntent: recommend=gợi ý/chọn tour; booking=đặt/giữ chỗ; faq=chính sách/thanh toán/giấy tờ; other=không liên quan.',
    'Ngân sách: VND (số). "5 triệu" → budgetMax 5000000 hoặc khoảng min/max tùy ngữ cảnh.',
    'keywords: từ khóa ngắn để search, tối đa 8.',
  ].join('\n')

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: system },
    ...(input.conversation ?? []).slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: `Tin nhắn mới:\n${input.message}` },
  ]

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

  const res = await client.chat.completions.create({
    model,
    temperature: 0,
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'slot_extraction',
        strict: true,
        schema: SLOT_EXTRACTION_SCHEMA as unknown as Record<string, unknown>,
      },
    },
  })

  const content = res.choices?.[0]?.message?.content
  if (!content) return null
  try {
    const raw = JSON.parse(content) as Record<string, unknown>
    return parseSlotsPayload(raw)
  } catch {
    return null
  }
}

async function extractSlotsWithLlmLegacyJsonObject(client: OpenAI, input: {
  message: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
}): Promise<LlmExtractedSlots | null> {
  const system = [
    'Bạn là trợ lý trích xuất thông tin cho hệ thống gợi ý tour du lịch Việt Nam.',
    'Nhiệm vụ: đọc hội thoại và tin nhắn mới, trả về JSON thuần.',
    'Không bịa địa danh/số tiền. Nếu không chắc, để null hoặc bỏ field.',
    'userIntent: recommend | faq | booking | other (theo hướng dẫn schema).',
    'Ngân sách: VND (number).',
  ].join('\n')

  const schemaHint = {
    userIntent: 'recommend | faq | booking | other',
    destination: 'string | null',
    departure: 'string | null',
    days: 'number | null',
    budgetMin: 'number | null',
    budgetMax: 'number | null',
    adults: 'number | null',
    children: 'number | null',
    infants: 'number | null',
    transportType: 'BUS | FLIGHT | MIXED | null',
    tourLine: 'PREMIUM | STANDARD | ECONOMY | GOOD_VALUE | null',
    keywords: 'string[] | null',
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: system },
    ...(input.conversation ?? []).slice(-8).map((m) => ({ role: m.role, content: m.content })),
    {
      role: 'user',
      content: [`Tin nhắn mới: ${input.message}`, '---', `Trả về JSON: ${JSON.stringify(schemaHint)}`].join('\n'),
    },
  ]

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

  const res = await client.chat.completions.create({
    model,
    temperature: 0,
    messages,
    response_format: { type: 'json_object' },
  })

  const content = res.choices?.[0]?.message?.content
  if (!content) return null
  try {
    return JSON.parse(content) as LlmExtractedSlots
  } catch {
    return null
  }
}

export async function extractSlotsWithLlm(input: {
  message: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
}): Promise<LlmExtractedSlots | null> {
  const client = getClient()
  if (!client) return null

  const useLegacy = process.env.OPENAI_SLOT_LEGACY_JSON === '1'

  if (useLegacy) {
    try {
      return await extractSlotsWithLlmLegacyJsonObject(client, input)
    } catch {
      return null
    }
  }

  try {
    return await extractSlotsWithLlmStructured(client, input)
  } catch {
    try {
      return await extractSlotsWithLlmLegacyJsonObject(client, input)
    } catch {
      return null
    }
  }
}

export type TourBriefForReply = {
  name: string
  durationDays: number | null
  basePrice: number | null
  departure?: string
  destination?: string
  slug?: string | null
}

/**
 * (B) Sinh câu trả lời tự nhiên dựa trên tour đã lấy từ DB; không bịa giá/tên ngoài danh sách.
 * Trả về null nếu tắt LLM hoặc lỗi → caller dùng fallbackReply.
 */
export async function generateRecommendationReplyNatural(input: {
  userMessage: string
  fallbackReply: string
  followUps: string
  tours: TourBriefForReply[]
  matched: boolean
  personalized: boolean
}): Promise<string | null> {
  if (!isNaturalReplyEnabled()) return null

  const client = getClient()
  if (!client) return null

  const model = process.env.OPENAI_REPLY_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

  const toursJson = input.tours.map((t) => ({
    ten: t.name,
    so_ngay: t.durationDays,
    gia_vnd: t.basePrice,
    khoi_hanh: t.departure ?? null,
    diem_den: t.destination ?? null,
    slug: t.slug ?? null,
  }))

  const system = [
    'Bạn là nhân viên tư vấn tour du lịch Việt Nam, xưng "mình", văn phong thân thiện, ngắn gọn.',
    'CHỈ dùng thông tin tour trong mảng "danh_sach_tour" do hệ thống cung cấp. Không bịa giá, không thêm tour không có trong mảng.',
    'Nếu matched=false: nói rõ đang gửi tour tham khảo / nổi bật vì chưa khớp hoàn toàn (theo gợi ý).',
    'Luôn kết thúc bằng câu hỏi gợi ý tiếp (dùng nội dung "cau_hoi_tiep" nếu có, có thể diễn đạt lại tự nhiên).',
    'Độ dài khoảng 3–6 câu, không liệt kê bullet dài.',
  ].join('\n')

  const userPayload = {
    tin_nhan_khach: input.userMessage,
    khop_tim_kiem: input.matched,
    goi_y_ca_nhan: input.personalized,
    cau_hoi_tiep: input.followUps.trim() || null,
    fallback_neu_loi: input.fallbackReply,
    danh_sach_tour: toursJson,
  }

  const res = await client.chat.completions.create({
    model,
    temperature: 0.45,
    max_tokens: 450,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `Dữ liệu JSON (dùng để trả lời, không trích nguyên văn JSON cho khách):\n${JSON.stringify(userPayload, null, 0)}`,
      },
    ],
  })

  const text = res.choices?.[0]?.message?.content?.trim()
  if (!text || text.length < 20) return null
  return text
}

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function getClaudeClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
}

async function fetchUrlContent(url) {
  const res = await fetch(url)
  const html = await res.text()
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, 10000)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { url, prompt: customPrompt, model = 'claude-sonnet-4-20250514' } = req.body
    if (!url) return res.status(400).json({ error: 'URL이 필요합니다' })

    const content = await fetchUrlContent(url)

    const systemPrompt = `당신은 10년 경력의 비즈니스 컨설턴트이자 제안서 전문 작성가입니다.

역할:
- 웹페이지 내용을 분석하여 해당 비즈니스에 최적화된 전문 제안서를 작성합니다.
- 데이터 기반의 구체적이고 실행 가능한 전략을 제시합니다.
- 업계 트렌드와 경쟁 환경을 고려한 인사이트를 포함합니다.

작성 규칙:
- 반드시 한국어로 작성합니다.
- 마크다운 형식을 사용합니다.
- 구체적인 수치와 근거를 포함합니다.
- 실행 가능한 액션 아이템을 제시합니다.
- 전문적이되 이해하기 쉬운 표현을 사용합니다.`

    const defaultUserPrompt = `이 웹페이지 내용을 분석하여 전문적인 비즈니스 제안서를 작성해주세요.

제안서에 포함할 항목:
1. 프로젝트 개요
2. 현황 분석
3. 제안 내용 (핵심 전략 3~5가지)
4. 기대 효과
5. 추진 일정 (단계별)
6. 예산 계획 (개략적)`

    const userMessage = `${customPrompt || defaultUserPrompt}\n\n웹페이지 내용:\n${content}`

    const claude = getClaudeClient()
    const message = await claude.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const proposal = message.content[0].text
    const usage = message.usage

    let savedData = null
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('proposals')
        .insert({ url, content: proposal, created_at: new Date().toISOString() })
        .select()
      if (!error) savedData = data?.[0]
    }

    res.json({ url, proposal, model, charCount: proposal.length, tokenUsage: usage, saved: savedData })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

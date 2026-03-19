import { useState } from 'react'
import '../styles/global.css'

const MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
]

const DEFAULT_PROMPT = `이 웹페이지 내용을 분석하여 전문적인 비즈니스 제안서를 작성해주세요.

제안서에 포함할 항목:
1. 프로젝트 개요
2. 현황 분석
3. 제안 내용 (핵심 전략 3~5가지)
4. 기대 효과
5. 추진 일정 (단계별)
6. 예산 계획 (개략적)`

function Home() {
  const [url, setUrl] = useState('')
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [model, setModel] = useState(MODELS[0].id)
  const [showPrompt, setShowPrompt] = useState(false)
  const [proposal, setProposal] = useState('')
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setProposal('')
    setMeta(null)

    try {
      const res = await fetch('/api/proposal/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), prompt, model }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProposal(data.proposal)
      setMeta({
        model: data.model,
        charCount: data.charCount,
        tokenUsage: data.tokenUsage,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>AI 제안서 생성기</h1>
        <p>URL을 입력하면 AI가 자동으로 제안서를 만들어 드립니다</p>
      </header>

      <div className="input-section">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="분석할 웹페이지 URL을 입력하세요"
          className="url-input"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !url.trim()}
          className="generate-btn"
        >
          {loading ? '생성 중...' : '제안서 생성'}
        </button>
      </div>

      <div className="options-bar">
        <div className="model-select">
          <label>모델</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="prompt-toggle"
          onClick={() => setShowPrompt(!showPrompt)}
        >
          {showPrompt ? '프롬프트 닫기' : '프롬프트 커스터마이징'}
        </button>
      </div>

      {showPrompt && (
        <div className="prompt-section">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="prompt-input"
            rows={8}
            placeholder="프롬프트를 입력하세요..."
          />
          <button
            className="reset-prompt"
            onClick={() => setPrompt(DEFAULT_PROMPT)}
          >
            기본값으로 초기화
          </button>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>AI가 제안서를 작성하고 있습니다...</p>
        </div>
      )}

      {proposal && (
        <div className="proposal-section">
          <div className="proposal-header">
            <h2>생성된 제안서</h2>
            <div className="proposal-actions">
              <button
                onClick={() => navigator.clipboard.writeText(proposal)}
                className="copy-btn"
              >
                복사
              </button>
            </div>
          </div>

          {meta && (
            <div className="meta-bar">
              <span className="meta-item">
                모델: <strong>{MODELS.find((m) => m.id === meta.model)?.name || meta.model}</strong>
              </span>
              <span className="meta-item">
                글자수: <strong>{meta.charCount?.toLocaleString()}자</strong>
              </span>
              <span className="meta-item">
                토큰: <strong>{meta.tokenUsage?.input_tokens?.toLocaleString()} → {meta.tokenUsage?.output_tokens?.toLocaleString()}</strong>
              </span>
            </div>
          )}

          <div
            className="proposal-content"
            dangerouslySetInnerHTML={{
              __html: proposal
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                .replace(/\n{2,}/g, '<br/><br/>')
                .replace(/\n/g, '<br/>'),
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Home

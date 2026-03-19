import { Router } from 'express'
import { google } from 'googleapis'

const router = Router()

function getYoutube() {
  return google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
  })
}

// 영상 ID 추출
function extractVideoId(url) {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return url
}

// 영상 정보 조회
router.get('/video', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'url 파라미터가 필요합니다' })

    const videoId = extractVideoId(url)
    const response = await getYoutube().videos.list({
      part: 'snippet,statistics,contentDetails',
      id: videoId,
    })

    const video = response.data.items?.[0]
    if (!video) return res.status(404).json({ error: '영상을 찾을 수 없습니다' })

    res.json({
      id: video.id,
      title: video.snippet.title,
      channel: video.snippet.channelTitle,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      tags: video.snippet.tags || [],
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      thumbnails: video.snippet.thumbnails,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 댓글 조회
router.get('/comments', async (req, res) => {
  try {
    const { url, maxResults = 20 } = req.query
    if (!url) return res.status(400).json({ error: 'url 파라미터가 필요합니다' })

    const videoId = extractVideoId(url)
    const response = await getYoutube().commentThreads.list({
      part: 'snippet',
      videoId,
      maxResults: Math.min(Number(maxResults), 100),
      order: 'relevance',
    })

    const comments = response.data.items.map((item) => ({
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
    }))

    res.json({ videoId, totalResults: response.data.pageInfo.totalResults, comments })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 자막 조회
router.get('/captions', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'url 파라미터가 필요합니다' })

    const videoId = extractVideoId(url)
    const response = await getYoutube().captions.list({
      part: 'snippet',
      videoId,
    })

    const captions = response.data.items.map((item) => ({
      id: item.id,
      language: item.snippet.language,
      name: item.snippet.name,
      trackKind: item.snippet.trackKind,
    }))

    res.json({ videoId, captions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 채널 정보 조회
router.get('/channel', async (req, res) => {
  try {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id 파라미터가 필요합니다' })

    const response = await getYoutube().channels.list({
      part: 'snippet,statistics',
      id,
    })

    const channel = response.data.items?.[0]
    if (!channel) return res.status(404).json({ error: '채널을 찾을 수 없습니다' })

    res.json({
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      viewCount: channel.statistics.viewCount,
      thumbnails: channel.snippet.thumbnails,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

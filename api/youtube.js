import { google } from 'googleapis'

function getYoutube() {
  return google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })
}

function extractVideoId(url) {
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^?&]+)/, /youtube\.com\/embed\/([^?&]+)/]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return url
}

export default async function handler(req, res) {
  try {
    const { url, type = 'video', maxResults = 20 } = req.query
    if (!url && type !== 'channel') return res.status(400).json({ error: 'url 파라미터가 필요합니다' })

    const youtube = getYoutube()
    const videoId = url ? extractVideoId(url) : null

    if (type === 'video') {
      const response = await youtube.videos.list({ part: 'snippet,statistics,contentDetails', id: videoId })
      const video = response.data.items?.[0]
      if (!video) return res.status(404).json({ error: '영상을 찾을 수 없습니다' })
      return res.json({
        id: video.id, title: video.snippet.title, channel: video.snippet.channelTitle,
        description: video.snippet.description, publishedAt: video.snippet.publishedAt,
        tags: video.snippet.tags || [], duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount, likeCount: video.statistics.likeCount,
        commentCount: video.statistics.commentCount, thumbnails: video.snippet.thumbnails,
      })
    }

    if (type === 'comments') {
      const response = await youtube.commentThreads.list({
        part: 'snippet', videoId, maxResults: Math.min(Number(maxResults), 100), order: 'relevance',
      })
      const comments = response.data.items.map(item => ({
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      }))
      return res.json({ videoId, totalResults: response.data.pageInfo.totalResults, comments })
    }

    res.status(400).json({ error: '지원하지 않는 type입니다' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

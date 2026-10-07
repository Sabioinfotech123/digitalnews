import { App, Button, Progress } from 'antd'
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { createAdminVideo, updateAdminVideo } from '@/api/content'
import { uploadMediaFile, type MediaUploadResult } from '@/api/media'
import type { VideoPayload } from '@/types/content'
import { getApiErrorMessage } from '@/utils/apiError'
import { slugify } from '@/utils/slugify'
import './VideoUploadProvider.scss'

export interface VideoDraftSession {
  values: Partial<VideoPayload>
  videoId?: string
}

type UploadStatus = 'idle' | 'uploading' | 'saving' | 'complete' | 'error'

interface VideoUploadState {
  jobId: number
  status: UploadStatus
  videoId?: string
  filename: string
  loaded: number
  total: number
  error: string | null
}

interface VideoUploadContextValue {
  drafts: Record<string, VideoDraftSession>
  upload: VideoUploadState
  getDraftSession: (key: string) => VideoDraftSession | undefined
  updateDraft: (key: string, values: Partial<VideoPayload>, videoId?: string | null) => void
  startUpload: (key: string, file: File) => Promise<MediaUploadResult>
  clearUpload: () => void
}

const initialUpload: VideoUploadState = {
  jobId: 0,
  status: 'idle',
  filename: '',
  loaded: 0,
  total: 0,
  error: null,
}

const VideoUploadContext = createContext<VideoUploadContextValue | null>(null)

function titleFromFilename(filename: string): string {
  const name = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  const title = name.length >= 3 ? name : `Video ${name || 'upload'}`
  return title.slice(0, 300)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} B`
  const megabytes = bytes / (1024 * 1024)
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`
}

export function VideoUploadProvider({ children }: { children: ReactNode }) {
  const { message } = App.useApp()
  const [drafts, setDrafts] = useState<Record<string, VideoDraftSession>>({})
  const draftsRef = useRef(drafts)
  const [upload, setUpload] = useState(initialUpload)
  const uploadRef = useRef(upload)
  const jobCounter = useRef(0)

  const getDraftSession = useCallback((key: string) => draftsRef.current[key], [])

  const updateDraft = useCallback(
    (key: string, values: Partial<VideoPayload>, videoId?: string | null) => {
      const current = draftsRef.current[key]
      const next = {
        ...draftsRef.current,
        [key]: {
          values: { ...current?.values, ...values },
          videoId: videoId === undefined ? current?.videoId : videoId ?? undefined,
        },
      }
      draftsRef.current = next
      setDrafts(next)
    },
    [],
  )

  const setUploadState = useCallback((next: VideoUploadState) => {
    uploadRef.current = next
    setUpload(next)
  }, [])

  const startUpload = useCallback(
    async (key: string, file: File) => {
      if (uploadRef.current.status === 'uploading' || uploadRef.current.status === 'saving') {
        throw new Error('A video upload is already in progress')
      }

      const jobId = ++jobCounter.current
      setUploadState({
        jobId,
        status: 'uploading',
        videoId: draftsRef.current[key]?.videoId,
        filename: file.name,
        loaded: 0,
        total: file.size,
        error: null,
      })

      try {
        const media = await uploadMediaFile(file, {
          kind: 'video',
          folder: 'videos',
          onProgress: (loaded, total) => {
            setUploadState({
              jobId,
              status: 'uploading',
              videoId: draftsRef.current[key]?.videoId,
              filename: file.name,
              loaded,
              total,
              error: null,
            })
          },
        })
        message.success('Video uploaded successfully')

        const session = draftsRef.current[key]
        const currentValues = session?.values ?? {}
        const currentTitle = String(currentValues.title ?? '').trim()
        const title = currentTitle.length >= 3 ? currentTitle : titleFromFilename(file.name)
        const currentSlug = String(currentValues.slug ?? '').trim()
        const fallbackSlug = `${slugify(title) || 'video'}-${Date.now().toString(36)}`
        const slug = currentSlug.length >= 3 ? currentSlug : fallbackSlug
        const payload: VideoPayload = {
          ...currentValues,
          title,
          slug,
          language: currentValues.language ?? 'en',
          description: currentValues.description?.trim() || null,
          content: currentValues.content || '',
          category_id: currentValues.category_id || null,
          tag_ids: currentValues.tag_ids || [],
          video_url: media.url,
          youtube_url: currentValues.youtube_url?.trim() || null,
          thumbnail_url: currentValues.thumbnail_url?.trim() || null,
          status: 'draft',
          sort_order: currentValues.sort_order ?? 0,
        }

        updateDraft(key, payload)
        setUploadState({
          jobId,
          status: 'saving',
          videoId: session?.videoId,
          filename: file.name,
          loaded: file.size,
          total: file.size,
          error: null,
        })

        const saved = session?.videoId
          ? await updateAdminVideo(session.videoId, payload)
          : await createAdminVideo(payload)
        updateDraft(key, payload, saved.id)
        message.success('Video draft saved successfully')
        setUploadState({
          jobId,
          status: 'complete',
          videoId: saved.id,
          filename: file.name,
          loaded: file.size,
          total: file.size,
          error: null,
        })
        return media
      } catch (error) {
        message.error(getApiErrorMessage(error, 'Video upload or draft save failed'))
        setUploadState({
          jobId,
          status: 'error',
          videoId: draftsRef.current[key]?.videoId,
          filename: file.name,
          loaded: uploadRef.current.loaded,
          total: file.size,
          error: getApiErrorMessage(error, 'Video upload or draft save failed'),
        })
        throw error
      }
    },
    [message, setUploadState, updateDraft],
  )

  const clearUpload = useCallback(() => setUploadState(initialUpload), [setUploadState])

  return (
    <VideoUploadContext.Provider
      value={{ drafts, upload, getDraftSession, updateDraft, startUpload, clearUpload }}
    >
      {children}
      <VideoUploadStatus />
    </VideoUploadContext.Provider>
  )
}

export function useVideoUpload(): VideoUploadContextValue | null {
  return useContext(VideoUploadContext)
}

function VideoUploadStatus() {
  const context = useVideoUpload()
  const navigate = useNavigate()
  if (!context || context.upload.status === 'idle') return null

  const { upload, clearUpload } = context
  const canOpenVideo = Boolean(upload.videoId)
  const openVideo = () => {
    if (upload.videoId) navigate(`/admin/videos/edit/${upload.videoId}`)
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!canOpenVideo || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    openVideo()
  }
  const percent = upload.total ? Math.min(100, Math.round((upload.loaded / upload.total) * 100)) : 0
  const heading =
    upload.status === 'uploading'
      ? 'Uploading video'
      : upload.status === 'saving'
        ? 'Saving draft'
        : upload.status === 'complete'
          ? 'Draft saved'
          : 'Upload failed'

  return (
    <aside
      className={`video-upload-status${canOpenVideo ? ' video-upload-status--clickable' : ''}`}
      role={canOpenVideo ? 'link' : 'status'}
      aria-label={canOpenVideo ? `${heading}. Open video editor.` : undefined}
      aria-live="polite"
      tabIndex={canOpenVideo ? 0 : undefined}
      onClick={openVideo}
      onKeyDown={handleKeyDown}
    >
      <div className="video-upload-status__header">
        <strong>{heading}</strong>
        {upload.status !== 'uploading' && upload.status !== 'saving' ? (
          <Button
            type="text"
            size="small"
            aria-label="Dismiss upload status"
            onClick={(event) => {
              event.stopPropagation()
              clearUpload()
            }}
            icon={<i className="fa-solid fa-xmark" aria-hidden />}
          />
        ) : null}
      </div>
      <p className="video-upload-status__filename" title={upload.filename}>
        {upload.filename}
      </p>
      <Progress
        percent={upload.status === 'saving' || upload.status === 'complete' ? 100 : percent}
        showInfo={false}
        status={upload.status === 'error' ? 'exception' : 'active'}
        size="small"
      />
      <div className="video-upload-status__detail">
        {upload.status === 'uploading'
          ? `${formatBytes(upload.loaded)} / ${formatBytes(upload.total)}`
          : upload.status === 'saving'
            ? 'Video uploaded. Saving as a draft…'
            : upload.status === 'complete'
              ? 'Your video is available in drafts.'
              : upload.error}
      </div>
      {upload.status === 'uploading' || upload.status === 'saving' ? (
        <p className="video-upload-status__notice">
          You can go to another page; the upload continues in the background. Keep this app open
          until the video and draft are finished.
        </p>
      ) : null}
    </aside>
  )
}
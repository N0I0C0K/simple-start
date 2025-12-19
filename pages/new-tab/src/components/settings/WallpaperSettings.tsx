import { cn } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { settingStorage, wallpaperHistoryStorage } from '@extension/storage'
import type { WallpaperType, WallhavenSortMode } from '@extension/storage'
import {
  Button,
  Stack,
  Text,
  Separator,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@extension/ui'
import { Check, Loader2, Image as ImageIcon, RefreshCw, History, Trash2, X, Upload, Link } from 'lucide-react'
import { type FC, useCallback, useEffect, useState, useRef } from 'react'
import { t } from '@extension/i18n'

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Scroll threshold in pixels to trigger loading more wallpapers
const SCROLL_THRESHOLD = 100

// Minimum time between API requests in milliseconds (to avoid rate limiting)
const API_REQUEST_THROTTLE = 1000

interface WallhavenThumb {
  large: string
  original: string
  small: string
}

interface WallhavenWallpaper {
  id: string
  path: string
  thumbs: WallhavenThumb
  resolution: string
  colors: string[]
}

interface WallhavenResponse {
  data: WallhavenWallpaper[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/**
 * Shared component for displaying a wallpaper image with loading/error states.
 */
const WallpaperImage: FC<{
  src: string
  alt: string
  className?: string
}> = ({ src, alt, className }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <ImageIcon className="size-6 text-muted-foreground" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn('aspect-video w-full object-cover', isLoading || hasError ? 'invisible' : 'visible', className)}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </>
  )
}

const WallpaperCard: FC<{
  wallpaper: WallhavenWallpaper
  isSelected: boolean
  onSelect: (url: string, thumbnailUrl: string) => void
}> = ({ wallpaper, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:scale-[1.02] w-full',
        isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-muted-foreground/30',
      )}
      onClick={() => onSelect(wallpaper.path, wallpaper.thumbs.small)}>
      <WallpaperImage src={wallpaper.thumbs.small} alt={`Wallpaper (${wallpaper.resolution})`} />
      {isSelected && (
        <div className="absolute right-1 top-1 rounded-full bg-primary p-1">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <Text level="xs" className="text-white">
          {wallpaper.resolution}
        </Text>
      </div>
    </button>
  )
}

const HistoryWallpaperCard: FC<{
  url: string
  thumbnailUrl: string
  isSelected: boolean
  onSelect: (url: string, thumbnailUrl: string) => void
  onDelete: (url: string) => void
}> = ({ url, thumbnailUrl, isSelected, onSelect, onDelete }) => {
  const handleDelete = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      onDelete(url)
    },
    [onDelete, url],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleDelete(e)
      } else if (e.key === ' ') {
        e.preventDefault()
        handleDelete(e)
      }
    },
    [handleDelete],
  )

  return (
    <div
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:scale-[1.02] w-full group',
        isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-muted-foreground/30',
      )}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(url, thumbnailUrl)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(url, thumbnailUrl)
      }}>
      <WallpaperImage src={thumbnailUrl} alt="History wallpaper" />
      {isSelected && (
        <div className="absolute right-1 top-1 rounded-full bg-primary p-1">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}
      <button
        type="button"
        className="absolute left-1 top-1 rounded-full bg-destructive/80 p-1 opacity-0 transition-opacity
          group-hover:opacity-100"
        onClick={handleDelete}
        onKeyDown={handleKeyDown}
        aria-label="Delete from history">
        <X className="size-3 text-destructive-foreground" />
      </button>
    </div>
  )
}

export const WallpaperSettings: FC = () => {
  const settings = useStorage(settingStorage)
  const historyData = useStorage(wallpaperHistoryStorage)
  const [wallpapers, setWallpapers] = useState<WallhavenWallpaper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Use refs to track loading state and last request time to prevent race conditions
  const isLoadingRef = useRef(false)
  const lastRequestTimeRef = useRef(0)

  // Use ref to track current sort mode to avoid stale closures
  const sortModeRef = useRef(settings.wallhavenSortMode)
  sortModeRef.current = settings.wallhavenSortMode

  const fetchWallpapers = useCallback(async (page: number, append = false) => {
    // Prevent duplicate requests using ref
    if (isLoadingRef.current) return

    // Throttle requests to avoid rate limiting
    const now = Date.now()
    if (now - lastRequestTimeRef.current < API_REQUEST_THROTTLE) return

    isLoadingRef.current = true
    lastRequestTimeRef.current = now

    if (page === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      // Always use the current sort mode from ref to avoid stale closures in this callback.
      // Accessing sortMode directly from state could result in outdated values if the callback is reused.
      const currentSortMode = sortModeRef.current

      // Wallhaven API - supports both toplist and random sorting (SFW only with purity=100)
      let apiUrl = `https://wallhaven.cc/api/v1/search?purity=100&page=${page}`

      if (currentSortMode === 'toplist') {
        apiUrl += '&topRange=1M&sorting=toplist'
      } else {
        apiUrl += '&sorting=random'
      }

      const response = await fetch(apiUrl)

      // Handle rate limiting (429 status)
      if (response.status === 429) {
        setError(t('wallpaperRateLimitError'))
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch wallpapers: ${response.statusText}`)
      }
      const data: WallhavenResponse = await response.json()
      if (append) {
        setWallpapers(prev => [...prev, ...data.data])
      } else {
        setWallpapers(data.data)
      }
      setCurrentPage(data.meta.current_page)
      setHasMore(data.meta.current_page < data.meta.last_page)
    } catch (err) {
      console.error('Failed to fetch wallpapers:', err)
      setError(t('wallpaperFetchError'))
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchWallpapers(1)
  }, [fetchWallpapers])

  // Use ref for current page to avoid recreating scroll handler
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage

  const hasMoreRef = useRef(hasMore)
  hasMoreRef.current = hasMore

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoadingRef.current || !hasMoreRef.current) return

    const container = scrollContainerRef.current
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight

    // Load more when within threshold of the bottom
    if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
      fetchWallpapers(currentPageRef.current + 1, true)
    }
  }, [fetchWallpapers])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleRefresh = useCallback(() => {
    setCurrentPage(1)
    setHasMore(true)
    fetchWallpapers(1)
  }, [fetchWallpapers])

  const handleSortModeChange = useCallback(
    async (mode: WallhavenSortMode) => {
      await settingStorage.update({ wallhavenSortMode: mode })
      setCurrentPage(1)
      setHasMore(true)
      setWallpapers([])
      // Update the ref immediately before fetching
      sortModeRef.current = mode
      fetchWallpapers(1, false)
    },
    [fetchWallpapers],
  )

  const handleSelectWallpaper = useCallback(async (url: string, thumbnailUrl: string) => {
    // Validate URL format before saving
    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        console.warn('Invalid wallpaper URL protocol:', urlObj.protocol)
        setError(t('wallpaperInvalidUrlError'))
        return
      }
    } catch {
      console.warn('Invalid wallpaper URL:', url)
      setError(t('wallpaperInvalidUrlError'))
      return
    }
    await settingStorage.update({ wallpaperUrl: url, wallpaperType: 'url' })
    await wallpaperHistoryStorage.addToHistory(url, thumbnailUrl)
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleLocalFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError(t('localWallpaperInvalidType'))
        clearFileInput()
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(t('localWallpaperTooLarge'))
        clearFileInput()
        return
      }

      setError(null)

      // Read file as base64
      const reader = new FileReader()
      reader.onload = async e => {
        const result = e.target?.result
        if (result && typeof result === 'string') {
          try {
            await settingStorage.update({
              localWallpaperData: result,
              wallpaperType: 'local',
            })
            // Clear error after successful upload
            setError(null)
          } catch (error) {
            console.error('Failed to save wallpaper:', error)
            // Check for quota exceeded error for more specific messaging
            const isQuotaError =
              (error && typeof error === 'object' && 'name' in error && error.name === 'QuotaExceededError') ||
              ('code' in error && error.code === 22) || // DOMException for quota
              ('message' in error &&
                typeof error.message === 'string' &&
                (error.message.toLowerCase().includes('quota') || error.message.toLowerCase().includes('exceeded')))
            setError(isQuotaError ? t('localWallpaperQuotaExceeded') : t('localWallpaperStorageError'))
            clearFileInput()
          }
        }
      }
      reader.onerror = () => {
        setError(t('localWallpaperReadError'))
        clearFileInput()
      }
      reader.readAsDataURL(file)
    },
    [clearFileInput],
  )

  const handleUploadClick = useCallback(() => {
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    fileInputRef.current?.click()
  }, [])

  const handleSelectLocalWallpaper = useCallback(async () => {
    await settingStorage.update({ wallpaperType: 'local' })
  }, [])

  const handleClearLocalWallpaper = useCallback(async () => {
    await settingStorage.update({
      localWallpaperData: null,
      wallpaperType: 'url',
    })
  }, [])

  const handleClearHistory = useCallback(async () => {
    await wallpaperHistoryStorage.clearHistory()
  }, [])

  const handleDeleteHistoryItem = useCallback(async (url: string) => {
    await wallpaperHistoryStorage.removeFromHistory(url)
  }, [])

  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      {/* Custom Wallpaper URL Section */}
      <Stack direction={'row'} className="items-center gap-2">
        <Link className="size-4 text-muted-foreground" />
        <Text gray level="s">
          {t('customWallpaperUrl')}
        </Text>
      </Stack>
      <Input
        placeholder={t('enterWallpaperUrl')}
        value={settings.wallpaperUrl || ''}
        onChange={e => {
          const newUrl = e.target.value
          // Only set wallpaperType to 'url' if the URL is non-empty and we're currently in local mode
          if (newUrl && settings.wallpaperType === 'local') {
            settingStorage.update({ wallpaperUrl: newUrl, wallpaperType: 'url' })
          } else {
            settingStorage.update({ wallpaperUrl: newUrl })
          }
        }}
      />

      <Separator className="my-2" />

      {/* Wallhaven Gallery Section */}
      <Stack direction={'row'} className="items-center justify-between">
        <Text gray level="s">
          {t('wallpaperSettingsDescription')}
        </Text>
        <Stack direction={'row'} className="items-center gap-2">
          <Select
            value={settings.wallhavenSortMode}
            onValueChange={value => handleSortModeChange(value as WallhavenSortMode)}
            disabled={isLoading}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toplist">{t('wallhavenToplist')}</SelectItem>
              <SelectItem value="random">{t('wallhavenRandom')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
          </Button>
        </Stack>
      </Stack>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-center">
          <Text level="s" className="text-destructive">
            {error}
          </Text>
        </div>
      )}

      {isLoading && wallpapers.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div ref={scrollContainerRef} className="h-[300px] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {wallpapers.map(wallpaper => (
              <WallpaperCard
                key={wallpaper.id}
                wallpaper={wallpaper}
                isSelected={settings.wallpaperType === 'url' && settings.wallpaperUrl === wallpaper.path}
                onSelect={handleSelectWallpaper}
              />
            ))}
          </div>
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasMore && wallpapers.length > 0 && (
            <div className="py-4 text-center">
              <Text gray level="xs">
                {t('noMoreWallpapers')}
              </Text>
            </div>
          )}
        </div>
      )}

      {/* History Wallpapers Section */}
      {historyData.history.length > 0 && (
        <>
          <Separator className="my-2" />
          <Stack direction={'row'} className="items-center justify-between">
            <Stack direction={'row'} className="items-center gap-1">
              <History className="size-4 text-muted-foreground" />
              <Text gray level="s">
                {t('historyWallpapers')}
              </Text>
            </Stack>
            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
              <Trash2 className="size-4" />
            </Button>
          </Stack>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {historyData.history.map(item => (
              <HistoryWallpaperCard
                key={item.url}
                url={item.url}
                thumbnailUrl={item.thumbnailUrl}
                isSelected={settings.wallpaperType === 'url' && settings.wallpaperUrl === item.url}
                onSelect={handleSelectWallpaper}
                onDelete={handleDeleteHistoryItem}
              />
            ))}
          </div>
        </>
      )}

      {/* Local Wallpaper Section */}
      <Separator className="my-2" />
      <Stack direction={'row'} className="items-center justify-between">
        <Stack direction={'row'} className="items-center gap-1">
          <Upload className="size-4 text-muted-foreground" />
          <Text gray level="s">
            {t('localWallpaper')}
          </Text>
        </Stack>
        <Stack direction={'row'} className="items-center gap-1">
          {settings.localWallpaperData && (
            <Button variant="ghost" size="sm" onClick={handleClearLocalWallpaper} aria-label={t('clearLocalWallpaper')}>
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleUploadClick}>
            <Upload className="size-4 mr-1" />
            {t('uploadLocalWallpaper')}
          </Button>
        </Stack>
      </Stack>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleLocalFileSelect}
      />
      {settings.localWallpaperData && (
        <div
          className={cn(
            `relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:scale-[1.02] w-full
            max-w-[200px]`,
            settings.wallpaperType === 'local'
              ? 'border-primary ring-2 ring-primary/50'
              : 'border-transparent hover:border-muted-foreground/30',
          )}
          role="button"
          tabIndex={0}
          aria-label={t('selectLocalWallpaper')}
          onClick={handleSelectLocalWallpaper}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleSelectLocalWallpaper()
            }
          }}>
          <WallpaperImage src={settings.localWallpaperData} alt="Local wallpaper" />
          {settings.wallpaperType === 'local' && (
            <div className="absolute right-1 top-1 rounded-full bg-primary p-1">
              <Check className="size-3 text-primary-foreground" />
            </div>
          )}
        </div>
      )}
    </Stack>
  )
}

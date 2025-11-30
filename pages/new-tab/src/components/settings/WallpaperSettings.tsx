import { cn } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { settingStorage, wallpaperHistoryStorage } from '@extension/storage'
import { Button, Stack, Text, Separator } from '@extension/ui'
import { Check, Loader2, Image as ImageIcon, RefreshCw, History, Trash2, X } from 'lucide-react'
import { type FC, useCallback, useEffect, useState, useRef } from 'react'
import { t } from '@extension/i18n'

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
  const handleDelete = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    onDelete(url)
  }, [onDelete, url])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDelete(e)
    } else if (e.key === ' ') {
      e.preventDefault()
      handleDelete(e)
    }
  }, [handleDelete])

  return (
    <div
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:scale-[1.02] w-full group',
        isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-muted-foreground/30',
      )}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(url, thumbnailUrl)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(url, thumbnailUrl) }}>
      <WallpaperImage src={thumbnailUrl} alt="History wallpaper" />
      {isSelected && (
        <div className="absolute right-1 top-1 rounded-full bg-primary p-1">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}
      <button
        type="button"
        className="absolute left-1 top-1 rounded-full bg-destructive/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={handleDelete}
        onKeyDown={handleKeyDown}
        aria-label="Delete from history"
      >
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
      // Wallhaven API for toplist wallpapers (SFW only with purity=100)
      const response = await fetch(`https://wallhaven.cc/api/v1/search?topRange=1M&sorting=toplist&purity=100&page=${page}`)
      
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
    await settingStorage.update({ wallpaperUrl: url })
    await wallpaperHistoryStorage.addToHistory(url, thumbnailUrl)
  }, [])

  const handleClearHistory = useCallback(async () => {
    await wallpaperHistoryStorage.clearHistory()
  }, [])

  const handleDeleteHistoryItem = useCallback(async (url: string) => {
    await wallpaperHistoryStorage.removeFromHistory(url)
  }, [])

  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      <Stack direction={'row'} className="items-center justify-between">
        <Text gray level="s">
          {t('wallpaperSettingsDescription')}
        </Text>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
        </Button>
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
        <div 
          ref={scrollContainerRef}
          className="h-[300px] overflow-y-auto pr-2"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {wallpapers.map(wallpaper => (
              <WallpaperCard
                key={wallpaper.id}
                wallpaper={wallpaper}
                isSelected={settings.wallpaperUrl === wallpaper.path}
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
              <Text gray level="xs">{t('noMoreWallpapers')}</Text>
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
                isSelected={settings.wallpaperUrl === item.url}
                onSelect={handleSelectWallpaper}
                onDelete={handleDeleteHistoryItem}
              />
            ))}
          </div>
        </>
      )}
    </Stack>
  )
}

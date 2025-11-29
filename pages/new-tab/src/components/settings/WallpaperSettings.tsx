import { cn } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { settingStorage } from '@extension/storage'
import { Button, Stack, Text, ScrollArea } from '@extension/ui'
import { Check, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { type FC, useCallback, useEffect, useState } from 'react'
import { t } from '@extension/i18n'

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

const WallpaperCard: FC<{
  wallpaper: WallhavenWallpaper
  isSelected: boolean
  onSelect: (url: string) => void
}> = ({ wallpaper, isSelected, onSelect }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <button
      type="button"
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:scale-[1.02] w-full',
        isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-muted-foreground/30',
      )}
      onClick={() => onSelect(wallpaper.path)}>
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
        src={wallpaper.thumbs.small}
        alt={`Wallpaper ${wallpaper.id}`}
        className={cn('aspect-video w-full object-cover', isLoading || hasError ? 'invisible' : 'visible')}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
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

export const WallpaperSettings: FC = () => {
  const settings = useStorage(settingStorage)
  const [wallpapers, setWallpapers] = useState<WallhavenWallpaper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWallpapers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Wallhaven API for toplist wallpapers (SFW only with purity=100)
      const response = await fetch('https://wallhaven.cc/api/v1/search?topRange=1M&sorting=toplist&purity=100')
      if (!response.ok) {
        throw new Error(`Failed to fetch wallpapers: ${response.statusText}`)
      }
      const data: WallhavenResponse = await response.json()
      setWallpapers(data.data)
    } catch (err) {
      console.error('Failed to fetch wallpapers:', err)
      setError(t('wallpaperFetchError'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWallpapers()
  }, [fetchWallpapers])

  const handleSelectWallpaper = useCallback(async (url: string) => {
    await settingStorage.update({ wallpaperUrl: url })
  }, [])

  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      <Stack direction={'row'} className="items-center justify-between">
        <Text gray level="s">
          {t('wallpaperSettingsDescription')}
        </Text>
        <Button variant="ghost" size="sm" onClick={fetchWallpapers} disabled={isLoading}>
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
        <ScrollArea className="h-[300px] pr-2">
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
        </ScrollArea>
      )}
    </Stack>
  )
}

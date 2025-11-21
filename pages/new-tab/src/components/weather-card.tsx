import { Stack, Text } from '@extension/ui'
import { t } from '@extension/i18n'
import { useEffect, useState } from 'react'
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Sun,
  Wind,
  Zap,
} from 'lucide-react'
import { getWeatherData, getWeatherDescription, type WeatherData } from '@/src/service/weather'
import { cn } from '@/lib/utils'

// Get appropriate weather icon based on weather code
const getWeatherIcon = (code: number, isDay: boolean, size: number = 48) => {
  const iconProps = { size, strokeWidth: 1.5 }

  if (code === 0) return <Sun {...iconProps} />
  if (code === 1 || code === 2) return <CloudSun {...iconProps} />
  if (code === 3) return <Cloud {...iconProps} />
  if (code === 45 || code === 48) return <CloudFog {...iconProps} />
  if (code >= 51 && code <= 55) return <CloudDrizzle {...iconProps} />
  if (code >= 61 && code <= 65) return <CloudRain {...iconProps} />
  if (code >= 71 && code <= 77) return <CloudSnow {...iconProps} />
  if (code >= 80 && code <= 82) return <CloudRain {...iconProps} />
  if (code >= 85 && code <= 86) return <CloudSnow {...iconProps} />
  if (code >= 95) return <Zap {...iconProps} />

  return <Cloud {...iconProps} />
}

interface WeatherCardProps {
  className?: string
}

export const WeatherCard = ({ className }: WeatherCardProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getWeatherData()
        setWeather(data)
      } catch (err) {
        console.error('Weather fetch error:', err)
        // Check if error is related to geolocation permission (PERMISSION_DENIED = 1)
        const PERMISSION_DENIED = 1
        if (err && typeof err === 'object' && 'code' in err && err.code === PERMISSION_DENIED) {
          setError(t('weatherLocationError'))
        } else {
          setError(t('weatherError'))
        }
      } finally {
        setLoading(false)
      }
    }

    loadWeather()

    // Refresh weather data every 30 minutes
    const interval = setInterval(loadWeather, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div
        className={cn(
          'backdrop-blur-2xl rounded-2xl shadow-md dark:backdrop-brightness-75 bg-slate-50/15 dark:bg-slate-700/5 p-6',
          className,
        )}>
        <Stack direction="column" className="items-center justify-center gap-2">
          <div className="animate-pulse">
            <Cloud size={48} strokeWidth={1.5} className="text-primary/60" />
          </div>
          <Text className="text-sm text-primary/70">{t('weatherLoading')}</Text>
        </Stack>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div
        className={cn(
          'backdrop-blur-2xl rounded-2xl shadow-md dark:backdrop-brightness-75 bg-slate-50/15 dark:bg-slate-700/5 p-6',
          className,
        )}>
        <Stack direction="column" className="items-center justify-center gap-2">
          <Cloud size={48} strokeWidth={1.5} className="text-primary/40" />
          <Text className="text-sm text-primary/70">{error}</Text>
        </Stack>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'backdrop-blur-2xl rounded-2xl shadow-md dark:backdrop-brightness-75 bg-slate-50/15 dark:bg-slate-700/5 p-6 transition-all duration-300 hover:bg-slate-50/20 dark:hover:bg-slate-700/10',
        className,
      )}>
      <Stack direction="column" className="gap-4">
        {/* Main weather info */}
        <Stack className="items-center justify-between gap-4">
          <Stack className="items-center gap-3">
            <div className="text-primary/80">{getWeatherIcon(weather.weatherCode, weather.isDay)}</div>
            <Stack direction="column" className="gap-0">
              <Text className="text-4xl font-light text-primary">{weather.temperature}°</Text>
              <Text className="text-xs text-primary/70">{getWeatherDescription(weather.weatherCode)}</Text>
            </Stack>
          </Stack>
        </Stack>

        {/* Additional weather details */}
        <Stack className="items-center justify-between gap-4 pt-3 border-t border-primary/10">
          <Stack direction="column" className="items-center gap-1 flex-1">
            <Stack className="items-center gap-1">
              <Wind size={14} strokeWidth={2} className="text-primary/60" />
              <Text className="text-xs text-primary/60">{t('windSpeed')}</Text>
            </Stack>
            <Text className="text-sm font-medium text-primary/80">{weather.windSpeed} km/h</Text>
          </Stack>

          <Stack direction="column" className="items-center gap-1 flex-1">
            <Stack className="items-center gap-1">
              <Droplets size={14} strokeWidth={2} className="text-primary/60" />
              <Text className="text-xs text-primary/60">{t('humidity')}</Text>
            </Stack>
            <Text className="text-sm font-medium text-primary/80">{weather.humidity}%</Text>
          </Stack>

          <Stack direction="column" className="items-center gap-1 flex-1">
            <Text className="text-xs text-primary/60">{t('feelsLike')}</Text>
            <Text className="text-sm font-medium text-primary/80">{weather.apparentTemperature}°</Text>
          </Stack>
        </Stack>
      </Stack>
    </div>
  )
}

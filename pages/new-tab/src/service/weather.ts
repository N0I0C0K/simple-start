export interface WeatherData {
  temperature: number
  apparentTemperature: number
  weatherCode: number
  humidity: number
  windSpeed: number
  isDay: boolean
}

export interface HourlyWeatherData {
  time: string
  temperature: number
  weatherCode: number
  isDay: boolean
}

export interface WeatherResponse {
  current: WeatherData
  hourly: HourlyWeatherData[]
  timestamp: number
}

export interface LocationCoords {
  latitude: number
  longitude: number
}

// Weather code to description mapping based on WMO Weather interpretation codes
export const getWeatherDescription = (code: number): string => {
  const weatherMap: { [key: number]: string } = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    85: 'Light Snow Showers',
    86: 'Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Hail',
  }
  return weatherMap[code] || 'Unknown'
}

// Get user's location using browser geolocation API
export const getUserLocation = (): Promise<LocationCoords> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      error => {
        // Wrap geolocation error with context
        const errorMessage =
          error.code === 1
            ? 'Location permission denied by user'
            : error.code === 2
              ? 'Location position unavailable'
              : 'Location request timeout'
        reject(new Error(`Geolocation failed: ${errorMessage}`, { cause: error }))
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
      },
    )
  })
}

// Cache key for localStorage
const WEATHER_CACHE_KEY = 'weather_cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

// Get cached weather data
const getCachedWeather = (): WeatherResponse | null => {
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!cached) return null

    const data: WeatherResponse = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid (within 30 minutes)
    if (now - data.timestamp < CACHE_DURATION) {
      return data
    }

    // Cache expired, remove it
    localStorage.removeItem(WEATHER_CACHE_KEY)
    return null
  } catch (error) {
    console.error('Error reading weather cache:', error)
    return null
  }
}

// Save weather data to cache
const setCachedWeather = (data: WeatherResponse): void => {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving weather cache:', error)
  }
}

// Fetch weather data from Open-Meteo API
export const fetchWeatherData = async (coords: LocationCoords): Promise<WeatherResponse> => {
  const { latitude, longitude } = coords

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,is_day',
    hourly: 'temperature_2m,weather_code,is_day',
    timezone: 'auto',
    forecast_days: '1',
  })

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch weather data')
  }

  const data = await response.json()

  // Validate API response structure
  if (!data.current || typeof data.current !== 'object') {
    throw new Error('Invalid API response structure')
  }

  const current = data.current
  const hourly = data.hourly

  // Get next 6 hours of forecast
  const hourlyForecast: HourlyWeatherData[] = []

  if (hourly && hourly.time && Array.isArray(hourly.time)) {
    for (let i = 0; i < Math.min(6, hourly.time.length); i++) {
      const time = hourly.time[i]
      const temp = hourly.temperature_2m?.[i]
      const code = hourly.weather_code?.[i]
      const isDay = hourly.is_day?.[i]

      if (time && temp !== undefined && code !== undefined && isDay !== undefined) {
        hourlyForecast.push({
          time,
          temperature: Math.round(temp),
          weatherCode: code,
          isDay: isDay === 1,
        })
      }
    }
  }

  const weatherResponse: WeatherResponse = {
    current: {
      temperature: Math.round(current.temperature_2m ?? 0),
      apparentTemperature: Math.round(current.apparent_temperature ?? 0),
      weatherCode: current.weather_code ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      isDay: current.is_day === 1,
    },
    hourly: hourlyForecast,
    timestamp: Date.now(),
  }

  // Save to cache
  setCachedWeather(weatherResponse)

  return weatherResponse
}

// Main function to get weather data with caching
export const getWeatherData = async (): Promise<WeatherResponse> => {
  // Check cache first
  const cached = getCachedWeather()
  if (cached) {
    return cached
  }

  // Fetch fresh data if cache miss or expired
  const coords = await getUserLocation()
  return await fetchWeatherData(coords)
}

export interface WeatherData {
  temperature: number
  apparentTemperature: number
  weatherCode: number
  humidity: number
  windSpeed: number
  isDay: boolean
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
        reject(error)
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
      },
    )
  })
}

// Fetch weather data from Open-Meteo API
export const fetchWeatherData = async (coords: LocationCoords): Promise<WeatherData> => {
  const { latitude, longitude } = coords

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,is_day&timezone=auto`

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

  return {
    temperature: Math.round(current.temperature_2m ?? 0),
    apparentTemperature: Math.round(current.apparent_temperature ?? 0),
    weatherCode: current.weather_code ?? 0,
    humidity: current.relative_humidity_2m ?? 0,
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    isDay: current.is_day === 1,
  }
}

// Main function to get weather data
export const getWeatherData = async (): Promise<WeatherData> => {
  const coords = await getUserLocation()
  return await fetchWeatherData(coords)
}

import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'

const MAX_HISTORY_SIZE = 10

export type WallpaperHistoryItem = {
  url: string
  thumbnailUrl: string
  addedAt: number
}

export type WallpaperHistoryProps = {
  history: WallpaperHistoryItem[]
}

type WallpaperHistoryStorage = BaseStorage<WallpaperHistoryProps> & {
  addToHistory: (url: string, thumbnailUrl: string) => Promise<void>
  removeFromHistory: (url: string) => Promise<void>
  clearHistory: () => Promise<void>
}

const defaultHistory: WallpaperHistoryProps = {
  history: [],
}

const storage = createStorage<WallpaperHistoryProps>('wallpaper-history-storage', defaultHistory, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

export const wallpaperHistoryStorage: WallpaperHistoryStorage = {
  ...storage,
  addToHistory: async (url: string, thumbnailUrl: string) => {
    const current = await storage.get()
    // Remove duplicate if exists
    const filtered = current.history.filter(item => item.url !== url)
    // Add new item at the beginning
    const newHistory = [
      { url, thumbnailUrl, addedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY_SIZE)
    await storage.set({ history: newHistory })
  },
  removeFromHistory: async (url: string) => {
    const current = await storage.get()
    const filtered = current.history.filter(item => item.url !== url)
    await storage.set({ history: filtered })
  },
  clearHistory: async () => {
    await storage.set({ history: [] })
  },
}

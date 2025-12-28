import { StorageEnum } from '../base/enums.js'
import { createStorage } from '../base/base.js'
import type { BaseStorage } from '../base/types.js'

type Theme = 'light' | 'dark' | 'system'

type ThemeStorage = BaseStorage<Theme> & {
  toggle: () => Promise<void>
}

const storage = createStorage<Theme>('theme-storage-key', 'system', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

// You can extend it with your own methods
export const exampleThemeStorage: ThemeStorage = {
  ...storage,
  toggle: async () => {
    await storage.set(currentTheme => {
      if (currentTheme === 'system') return 'system'
      return currentTheme === 'light' ? 'dark' : 'light'
    })
  },
}

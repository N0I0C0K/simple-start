import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'

export const DEFAULT_WALLPAPER_URL = 'https://w.wallhaven.cc/full/ml/wallhaven-mlpll9.jpg'

type SettingProps = {
  useHistorySuggestion: boolean
  autoFocusCommandInput: boolean
  wallpaperUrl?: string
}

type SettingsStorage = BaseStorage<SettingProps> & {
  update: (data: Partial<SettingProps>) => Promise<void>
}

const defaultSetting: SettingProps = {
  useHistorySuggestion: true,
  autoFocusCommandInput: true,
  wallpaperUrl: undefined,
}

const storage = createStorage<SettingProps>('settings-storage', defaultSetting, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

export const settingStorage: SettingsStorage = {
  ...storage,
  update: async data => {
    storage.set(preVal => Object.assign(preVal, data))
  },
}

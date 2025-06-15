import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'

type SettingProps = {
  useHistorySuggestion: boolean
  autoFocusCommandInput: boolean
}

type SettingsStorage = BaseStorage<SettingProps> & {
  update: (data: Partial<SettingProps>) => Promise<void>
}

const defaultSetting: SettingProps = {
  useHistorySuggestion: true,
  autoFocusCommandInput: true,
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

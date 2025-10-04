import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'

export const DEFAULT_WALLPAPER_URL = 'https://w.wallhaven.cc/full/ml/wallhaven-mlpll9.jpg'
export const DEFAULT_MQTT_BROKER_URL = 'mqtt://broker.emqx.io'

type MqttSetting = {
  mqttBrokerUrl: string
  secretKey: string
  enabled: boolean
  username: string
}

type SettingProps = {
  useHistorySuggestion: boolean
  autoFocusCommandInput: boolean
  wallpaperUrl?: string
  mqttSettings?: MqttSetting
}

type SettingsStorage = BaseStorage<SettingProps> & {
  update: (data: Partial<SettingProps>) => Promise<void>
  getMqttSettings: () => Promise<MqttSetting | undefined>
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
  getMqttSettings: async () => {
    const settings = await storage.get()
    return settings.mqttSettings
  },
}

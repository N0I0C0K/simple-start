import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'
import deepmerge from 'deepmerge'

export const DEFAULT_WALLPAPER_URL = 'https://w.wallhaven.cc/full/ml/wallhaven-mlpll9.jpg'
export const DEFAULT_MQTT_BROKER_URL = 'mqtt://broker.emqx.io'

export type MqttSetting = {
  mqttBrokerUrl: string
  secretKey: string
  enabled: boolean
  username: string
}

export type TimeDisplaySize = 'small' | 'medium' | 'large'

export type SettingProps = {
  useHistorySuggestion: boolean
  autoFocusCommandInput: boolean
  wallpaperUrl: string | null
  mqttSettings: MqttSetting
  timeDisplaySize: TimeDisplaySize
}

type DeepPartial<T> = T extends object
  ? {
    [K in keyof T]?: DeepPartial<T[K]>;
  }
  : T;

type SettingsStorage = BaseStorage<SettingProps> & {
  update: (data: DeepPartial<SettingProps>) => Promise<void>
  getMqttSettings: () => Promise<MqttSetting | null>
}

const defaultSetting: SettingProps = {
  useHistorySuggestion: true,
  autoFocusCommandInput: true,
  wallpaperUrl: null,
  mqttSettings: {
    enabled: false,
    mqttBrokerUrl: DEFAULT_MQTT_BROKER_URL,
    secretKey: 'ABCDEF',
    username: 'MomoBoss',
  },
  timeDisplaySize: 'large',
}

const storage = createStorage<SettingProps>('settings-storage', defaultSetting, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

export const settingStorage: SettingsStorage = {
  ...storage,
  update: async data => {
    storage.set(preVal => (deepmerge(preVal, data) as SettingProps))
  },
  getMqttSettings: async () => {
    const settings = await storage.get()
    return settings.mqttSettings
  },
}

import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'
import deepmerge from 'deepmerge'
import type { ExportedData } from '../utils/exportImport'
import { exportDataAsJSON, importDataFromJSON } from '../utils/exportImport'

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
  wallpaperUrl: string | null
  mqttSettings: MqttSetting
}

type DeepPartial<T> = T extends object
  ? {
    [K in keyof T]?: DeepPartial<T[K]>;
  }
  : T;

type SettingsStorage = BaseStorage<SettingProps> & {
  update: (data: DeepPartial<SettingProps>) => Promise<void>
  getMqttSettings: () => Promise<MqttSetting | null>
  exportData: () => Promise<void>
  importData: (file: File) => Promise<void>
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
  exportData: async () => {
    const { quickUrlItemsStorage } = await import('./quickUrlStorage')
    const { exampleThemeStorage } = await import('./exampleThemeStorage')
    const settings = await storage.get()
    const quickUrls = await quickUrlItemsStorage.get()
    const theme = await exampleThemeStorage.get()
    
    const exportData: ExportedData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      theme,
      settings,
      quickUrls,
    }
    
    exportDataAsJSON(exportData)
  },
  importData: async (file: File) => {
    const { quickUrlItemsStorage } = await import('./quickUrlStorage')
    const { exampleThemeStorage } = await import('./exampleThemeStorage')
    const data = await importDataFromJSON(file)
    
    // Import settings
    await storage.set(data.settings)
    
    // Import quick URLs
    await quickUrlItemsStorage.set(data.quickUrls)
    
    // Import theme if present
    if (data.theme) {
      await exampleThemeStorage.set(data.theme)
    }
  },
}

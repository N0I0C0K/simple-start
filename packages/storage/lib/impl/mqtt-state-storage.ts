import { StorageEnum } from '../base/enums.js'
import { createStorage } from '../base/base.js'
import type { BaseStorage } from '../base/types.js'

export type MqttState = {
  connected: boolean
}

export type MqttStateManager = BaseStorage<MqttState> & {
  setConnected: (connected: boolean) => Promise<void>
}

export const mqttStateStorage = createStorage<MqttState>('mqtt-state-storage', {
  connected: false,
}, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

export const mqttStateManager: MqttStateManager = {
  ...mqttStateStorage,
  setConnected: async (connected: boolean) => {
    await mqttStateStorage.set((prev) => ({
      ...prev,
      connected,
    }))
  }
}


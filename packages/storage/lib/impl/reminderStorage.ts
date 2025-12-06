import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'

export type ReminderItem = {
  id: string
  name: string
  icon: string
  enabled: boolean
  intervalMinutes: number
  startTime: string // ISO 8601 timestamp
  createdAt: string // ISO 8601 timestamp
  lastTriggeredAt?: string // ISO 8601 timestamp
}

export interface ReminderItemsStorageFunc {
  add: (item: ReminderItem) => Promise<void>
  removeAt: (index: number) => Promise<void>
  removeById: (id: string) => Promise<void>
  putById: (id: string, val: ReminderItem) => Promise<void>
}

export type ReminderItemsStorage = BaseStorage<ReminderItem[]>

const storage = createStorage<ReminderItem[]>('reminder-items-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

export const reminderItemsStorage: ReminderItemsStorage & ReminderItemsStorageFunc = {
  ...storage,
  add: async (item: ReminderItem) => {
    storage.set(value => [...value, item])
  },
  removeAt: async (index: number) => {
    storage.set(value => value.filter((val, idx) => idx !== index))
  },
  removeById: async (id: string) => {
    storage.set(value => value.filter(val => val.id !== id))
  },
  putById: async (id, val) => {
    storage.set(items => items.map(it => (it.id === id ? val : it)))
  },
}

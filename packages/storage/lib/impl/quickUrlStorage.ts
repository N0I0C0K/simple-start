import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'

type QuickUrlItem = {
  id: number
  title: string
  url: string
}

type QuickUrlItemsStorage = BaseStorage<QuickUrlItem[]> & {
  add: (item: QuickUrlItem) => Promise<void>
  removeAt: (index: number) => Promise<void>
  removeById: (id: number) => Promise<void>
}

const storage = createStorage<QuickUrlItem[]>('theme-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

// You can extend it with your own methods
export const quickUrlItemsStorage: QuickUrlItemsStorage = {
  ...storage,
  add: async (item: QuickUrlItem) => {
    storage.set(value => [...value, item])
  },
  removeAt: async (index: number) => {
    storage.set(value => value.splice(index, 1))
  },
  removeById: async (id: number) => {
    storage.set(value => value.filter(val => val.id != id))
  },
}

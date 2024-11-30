import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'
import { getIconUrlFromWebsit } from '../utils'

export type QuickUrlItem = {
  id: string
  title: string
  url: string
  iconUrl?: string
}

type QuickUrlItemsStorage = BaseStorage<QuickUrlItem[]> & {
  add: (item: QuickUrlItem) => Promise<void>
  removeAt: (index: number) => Promise<void>
  removeById: (id: string) => Promise<void>
  sortItemsByIds: (ids: string[]) => Promise<void>
  putById: (id: string, val: QuickUrlItem) => Promise<void>
}

const storage = createStorage<QuickUrlItem[]>('quick-url-item-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

async function maybeFillIconUrl(val: QuickUrlItem) {
  console.log(val)
  if (!val.iconUrl) {
    val.iconUrl = await getIconUrlFromWebsit(val.url)
  }
}

// You can extend it with your own methods
export const quickUrlItemsStorage: QuickUrlItemsStorage = {
  ...storage,
  add: async (item: QuickUrlItem) => {
    await maybeFillIconUrl(item)
    storage.set(value => [...value, item])
  },
  removeAt: async (index: number) => {
    storage.set(value => value.splice(index, 1))
  },
  removeById: async (id: string) => {
    storage.set(value => value.filter(val => val.id != id))
  },
  sortItemsByIds: async (ids: string[]) => {
    const idAndPriorityMapping = new Map(ids.map((val, idx) => [val, idx]))
    storage.set(values =>
      values.sort((lv, rv) => (idAndPriorityMapping.get(lv.id) ?? 10000) - (idAndPriorityMapping.get(rv.id) ?? 10000)),
    )
  },
  putById: async (id, val) => {
    await maybeFillIconUrl(val)
    storage.set(items => items.map(it => (it.id === id ? val : it)))
  },
}

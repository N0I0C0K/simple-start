import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage, TodoItem } from '../base/types'

export type TodoItemsStorage = BaseStorage<TodoItem[]>

export interface TodoItemsStorageFunc {
  add: (text: string) => Promise<void>
  removeById: (id: string) => Promise<void>
  toggleCompleted: (id: string) => Promise<void>
  updateText: (id: string, text: string) => Promise<void>
  clearCompleted: () => Promise<void>
}

const storage = createStorage<TodoItem[]>('todo-items-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

export const todoItemsStorage: TodoItemsStorage & TodoItemsStorageFunc = {
  ...storage,
  add: async (text: string) => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      completed: false,
      createdAt: Date.now(),
    }
    await storage.set(value => [...value, newTodo])
  },
  removeById: async (id: string) => {
    await storage.set(value => value.filter(item => item.id !== id))
  },
  toggleCompleted: async (id: string) => {
    await storage.set(value =>
      value.map(item => (item.id === id ? { ...item, completed: !item.completed } : item)),
    )
  },
  updateText: async (id: string, text: string) => {
    await storage.set(value => value.map(item => (item.id === id ? { ...item, text } : item)))
  },
  clearCompleted: async () => {
    await storage.set(value => value.filter(item => !item.completed))
  },
}

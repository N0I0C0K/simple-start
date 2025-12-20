import { StorageEnum } from '../base/enums'
import { createStorage } from '../base/base'
import type { BaseStorage } from '../base/types'
import { ONLINE_USER_TIMEOUT_MS } from './constants'

export type OnlineUser = {
  username: string
  lastHeartbeat: number
}

export type OnlineUsersState = {
  users: Record<string, OnlineUser>
}

export type OnlineUsersStorage = BaseStorage<OnlineUsersState> & {
  updateUserHeartbeat: (username: string) => Promise<void>
  getOnlineUsers: (timeoutMs?: number) => Promise<OnlineUser[]>
  cleanupOfflineUsers: (timeoutMs?: number) => Promise<void>
}

const defaultOnlineUsersState: OnlineUsersState = {
  users: {},
}

const storage = createStorage<OnlineUsersState>('online-users-storage', defaultOnlineUsersState, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
})

export const onlineUsersStorage: OnlineUsersStorage = {
  ...storage,
  updateUserHeartbeat: async (username: string) => {
    await storage.set(prev => ({
      users: {
        ...prev.users,
        [username]: {
          username,
          lastHeartbeat: Date.now(),
        },
      },
    }))
  },
  getOnlineUsers: async (timeoutMs = ONLINE_USER_TIMEOUT_MS) => {
    const state = await storage.get()
    const now = Date.now()
    return Object.values(state.users).filter(user => now - user.lastHeartbeat < timeoutMs)
  },
  cleanupOfflineUsers: async (timeoutMs = ONLINE_USER_TIMEOUT_MS) => {
    await storage.set(prev => {
      const now = Date.now()
      const activeUsers: Record<string, OnlineUser> = {}
      Object.entries(prev.users).forEach(([username, user]) => {
        if (now - user.lastHeartbeat < timeoutMs) {
          activeUsers[username] = user
        }
      })
      return { users: activeUsers }
    })
  },
}

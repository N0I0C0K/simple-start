import { useStorage } from '@extension/shared'
import { onlineUsersStorage, ONLINE_USER_TIMEOUT_MS } from '@extension/storage'
import type { OnlineUser } from '@extension/storage'
import { Avatar, AvatarFallback, Stack, Text } from '@extension/ui'
import { Users } from 'lucide-react'
import type { FC } from 'react'
import React from 'react'
import { t } from '@extension/i18n'
import { SettingItem } from '../setting-pannel'

const MAX_SHORT_USERNAME_LENGTH = 2
const MAX_INITIALS_LENGTH = 2

const OnlineUsersDisplay: FC = () => {
  const onlineUsersState = useStorage(onlineUsersStorage)

  const getOnlineUsers = React.useCallback((): OnlineUser[] => {
    const now = Date.now()
    return Object.values(onlineUsersState.users).filter(user => now - user.lastHeartbeat < ONLINE_USER_TIMEOUT_MS)
  }, [onlineUsersState])

  const onlineUsers = getOnlineUsers()

  const getInitials = (username: string): string => {
    if (!username) return '?'
    // For Chinese characters or single words, take first character
    if (username.length <= MAX_SHORT_USERNAME_LENGTH) return username.substring(0, 1).toUpperCase()
    // For multiple words, take first letter of first two words
    const words = username.split(/\s+/).filter(word => word.length > 0)
    if (words.length >= MAX_INITIALS_LENGTH) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    // Otherwise take first two characters
    return username.substring(0, MAX_INITIALS_LENGTH).toUpperCase()
  }

  const getColorFromUsername = (username: string): string => {
    // Generate a consistent color based on username
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ]
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <SettingItem
      IconClass={Users}
      title={t('onlineUsers')}
      description={t('onlineUsersDescription')}
      control={
        <Stack direction="row" className="items-center gap-0">
          {onlineUsers.length === 0 ? (
            <Text gray level="s" className="whitespace-nowrap">
              {t('noOnlineUsers')}
            </Text>
          ) : (
            <Stack direction="row" className="items-center -space-x-2">
              {onlineUsers.map((user, index) => (
                <Avatar
                  key={user.username}
                  className="h-8 w-8 border-2 border-background"
                  style={{ zIndex: onlineUsers.length - index }}
                  title={user.username}>
                  <AvatarFallback className={`text-xs text-white ${getColorFromUsername(user.username)}`}>
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </Stack>
          )}
        </Stack>
      }
    />
  )
}

export default OnlineUsersDisplay

import { useStorage } from '@extension/shared'
import { onlineUsersStorage } from '@extension/storage'
import { Avatar, AvatarFallback, Stack, Text } from '@extension/ui'
import { Users } from 'lucide-react'
import type { FC } from 'react'
import React from 'react'
import { t } from '@extension/i18n'
import { SettingItem } from '../setting-pannel'

const OnlineUsersDisplay: FC = () => {
  const onlineUsersState = useStorage(onlineUsersStorage)
  const [onlineUsers, setOnlineUsers] = React.useState<Array<{ username: string; lastHeartbeat: number }>>([])

  React.useEffect(() => {
    // Filter users who had heartbeat in last 2 minutes
    const now = Date.now()
    const activeUsers = Object.values(onlineUsersState.users).filter(
      user => now - user.lastHeartbeat < 120000, // 2 minutes
    )
    setOnlineUsers(activeUsers)
  }, [onlineUsersState])

  const getInitials = (username: string): string => {
    if (!username) return '?'
    // For Chinese characters or single words, take first character
    if (username.length <= 2) return username.substring(0, 1).toUpperCase()
    // For multiple words, take first letter of first two words
    const words = username.split(/\s+/)
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    // Otherwise take first two characters
    return username.substring(0, 2).toUpperCase()
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

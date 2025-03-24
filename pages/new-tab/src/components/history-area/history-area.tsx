import { Center } from '@extension/ui'
import { useMemo, useState } from 'react'
import { HistorySuggestionList } from './history-list'
import { useStorage } from '@extension/shared'
import { settingStorage } from '@extension/storage'
import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'

export const HistoryArea = () => {
  const settings = useStorage(settingStorage)
  const [initialVariant] = useState(() => {
    return settings.useHistorySuggestion ? 'show' : 'hide'
  })
  const variants = useMemo<Variants>(() => {
    return {
      show: {
        y: 0,
      },
      hide: {
        y: 400,
      },
    }
  }, [])

  return (
    <Center>
      <motion.div
        variants={variants}
        initial={initialVariant}
        animate={settings.useHistorySuggestion ? 'show' : 'hide'}
        className="relative min-w-[20rem] w-[50%]">
        <HistorySuggestionList />
      </motion.div>
    </Center>
  )
}

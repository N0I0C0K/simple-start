import { cn } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { historySuggestStorage } from '@extension/storage'
import { ScrollArea, Stack } from '@extension/ui'
import { type FC, useState, useEffect } from 'react'
import { ListItem } from './history-list-item'

export const HOUR_SECOND = 1000 * 60 * 60
export const UPDTAE_KEY = 'history-update-key'

export function refreshHistorySuggest(ts: number) {
  localStorage.setItem(UPDTAE_KEY, Number.MAX_SAFE_INTEGER.toString())
  historySuggestStorage.refresh().then(
    () => {
      localStorage.setItem(UPDTAE_KEY, (ts + HOUR_SECOND - 100).toString())
    },
    () => {
      localStorage.setItem(UPDTAE_KEY, (ts + HOUR_SECOND - 100).toString())
    },
  )
}

export const HistorySuggestionList: FC<{ className?: string }> = ({ className }) => {
  const historySuggestItems = useStorage(historySuggestStorage)

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  useEffect(() => {
    const timeNow = new Date()
    const ts = timeNow.getTime()
    const latestUpdateTs = Number.parseInt(localStorage.getItem(UPDTAE_KEY) ?? '0')
    if (ts - latestUpdateTs > HOUR_SECOND / 2) {
      refreshHistorySuggest(ts)
    }

    const offset = HOUR_SECOND - (timeNow.getTime() % HOUR_SECOND)
    const timerId = setTimeout(() => {
      setRefreshTrigger(val => val + 1)
    }, offset)

    return () => {
      clearTimeout(timerId)
    }
  }, [refreshTrigger])
  return (
    <ScrollArea className={cn('duration-300 w-full overflow-hidden h-56 max-xl:h-72', className)} scrollHideDelay={200}>
      {/* <Stack direction={'row'} className="p-1 gap-2">
              <Button variant={'ghost'} className="rounded-xl p-1 border border-slate-200/20">
                History
              </Button>
              <Button
                variant={'ghost'}
                className="rounded-xl p-1 border border-slate-200/20"
                onClick={() => {
                  historySuggestStorage.refresh()
                }}>
                Refresh
              </Button>
            </Stack> */}
      <Stack direction={'column'} className={cn('text-zinc-900 dark:text-zinc-300')}>
        {historySuggestItems.map(val => {
          return <ListItem {...val} key={val.id} className="first:rounded-t-xl" />
        })}
      </Stack>
    </ScrollArea>
  )
}

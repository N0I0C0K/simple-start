import { useStorage } from '@extension/shared'
import { historySuggestStorage, quickUrlItemsStorage, settingStorage } from '@extension/storage'
import { Button, Stack, Text } from '@extension/ui'
import { useEffect, useMemo, useState, type ElementType, type FC } from 'react'
import { cn } from '@/lib/utils'
import { getDefaultIconUrl } from '@/lib/url'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItemWitchIcon,
} from '@extension/ui/lib/components/ui/context-menu'
import { Plus, Trash } from 'lucide-react'

const ListItem: FC<{
  className?: string
  title: string
  url: string
  iconUrl?: string
  id: string
  lastVisitTime?: number
}> = ({ className, title, iconUrl, url, id, lastVisitTime }) => {
  const lastVisitDate = useMemo(() => new Date(lastVisitTime ?? 0), [lastVisitTime])
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Stack
          direction={'row'}
          className={cn(
            'w-full items-center py-1.5 cursor-pointer group',
            'hover:bg-slate-200/10 duration-200',
            className,
          )}
          onClick={ev => {
            if (ev.ctrlKey) {
              chrome.tabs.create({ url: url, active: true })
            } else {
              chrome.tabs.update({ url: url })
            }
          }}>
          <img src={iconUrl ?? getDefaultIconUrl(url)} className="size-5 rounded-md mx-3" alt="list-icon" />
          <Text className="cursor-pointer">{title}</Text>
          <span className="flex-1" />
          <Text className="hidden group-hover:block font-thin text-sm">{lastVisitDate.toLocaleDateString()}</Text>
          <span className="w-2" />
        </Stack>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-[16rem]">
        <ContextMenuItemWitchIcon
          IconType={Plus}
          shortCut="Ctrl+A"
          onClick={() => {
            console.log(title)
            quickUrlItemsStorage.add({
              id,
              title,
              url,
            })
            historySuggestStorage.removeById(id)
          }}>
          Add to favor
        </ContextMenuItemWitchIcon>
        <ContextMenuItemWitchIcon
          IconType={Trash}
          className="text-red-800"
          shortCut="Ctrl+D"
          onClick={() => {
            historySuggestStorage.removeById(id)
          }}>
          Delete
        </ContextMenuItemWitchIcon>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const HOUR_SECOND = 1000 * 60 * 60
const UPDTAE_KEY = 'history-update-key'

function refreshHistorySuggest(ts: number) {
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

export const HistorySuggestionList: FC = () => {
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

  useEffect(() => {
    // chrome.history
    //   .search({
    //     text: '',
    //     maxResults: 100,
    //   })
    //   .then(val => {
    //     console.log(val)
    //   })
  }, [])

  return (
    <div className="backdrop-blur-2xl rounded-t-xl shadow-md dark:backdrop-brightness-75 duration-300 w-full overflow-hidden">
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
        {historySuggestItems.slice(0, 6).map(val => {
          return <ListItem {...val} key={val.id} className="first:rounded-t-xl" />
        })}
      </Stack>
    </div>
  )
}

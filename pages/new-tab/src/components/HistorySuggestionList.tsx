import { useStorage } from '@extension/shared'
import { historySuggestStorage, quickUrlItemsStorage, settingStorage } from '@extension/storage'
import { Button, Stack, Text } from '@extension/ui'
import { useMemo, type ElementType, type FC } from 'react'
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
            'w-full items-center p-2 cursor-pointer group',
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
          <img src={iconUrl ?? getDefaultIconUrl(url)} className="size-5 rounded-md mr-2" alt="list-icon" />
          <Text className="cursor-pointer">{title}</Text>
          <span className="flex-1" />
          <Text className="hidden group-hover:block text-slate-600/60">{lastVisitDate.toLocaleDateString()}</Text>
        </Stack>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-[16rem]">
        <ContextMenuItemWitchIcon
          IconType={Plus}
          shortCut="Ctrl+A"
          onClick={() => {
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

export const HistorySuggestionList: FC = () => {
  const historySuggestItems = useStorage(historySuggestStorage)
  return (
    <div className="border border-slate-200/20 backdrop-blur-2xl rounded-t-xl shadow-md dark:backdrop-brightness-75 duration-300 w-full overflow-hidden">
      <Stack direction={'row'} className="p-1 gap-2">
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
      </Stack>
      <Stack direction={'column'} className={cn('divide-y divide-slate-200/20', 'text-zinc-900 dark:text-zinc-300')}>
        {historySuggestItems.slice(0, 6).map(val => {
          return <ListItem {...val} key={val.id} className="first:rounded-t-xl" />
        })}
      </Stack>
    </div>
  )
}

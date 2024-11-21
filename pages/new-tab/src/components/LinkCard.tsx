import { cn } from '@/lib/utils'
import { quickUrlItemsStorage } from '@extension/storage'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Stack, Button, Text } from '@extension/ui'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuShortcut,
  ContextMenuItemWitchIcon,
} from '@extension/ui/lib/components/ui/context-menu'
import { Trash, Pencil } from 'lucide-react'
import type { FC } from 'react'
import { useMemo, useState } from 'react'

interface LinkCardProps {
  url: string
  title: string
  id: string
}

export const LinkCard: FC<LinkCardProps> = ({ url, title, id }) => {
  const urlParsed = useMemo(() => {
    return new URL(url)
  }, [url])
  const [dragAreaVisable, setDragAreaVisible] = useState(false)
  return (
    <TooltipProvider>
      <ContextMenu>
        <Tooltip
          onOpenChange={opened => {
            setDragAreaVisible(opened)
          }}>
          <ContextMenuTrigger asChild>
            <TooltipTrigger asChild>
              <div
                className="relative group flex flex-col items-center justify-center overflow-hidden p-2 gap-1 cursor-pointer rounded-md duration-200"
                key={id}>
                <div
                  className="relative flex flex-row items-center justify-center rounded-md size-[4.5rem] text-primary bg-zinc-200/20 group-hover:bg-zinc-100/40 active:bg-zinc-100/70 duration-200"
                  onClick={ev => {
                    if (ev.ctrlKey) {
                      chrome.tabs.create({ url: url })
                    } else {
                      chrome.tabs.update({ url: url })
                    }
                  }}
                  aria-hidden="true">
                  <img src={`${urlParsed.origin}/favicon.ico`} alt="img" className="size-8" />
                </div>
                <Text level="s" className="select-none">
                  {title}
                </Text>
                <div
                  id={dragAreaVisable ? 'drag-area' : 'non-drag-area'}
                  className={cn(
                    'opacity-0 mt-1 duration-300 h-2 w-12 bg-slate-100/40 rounded-xl hover:bg-slate-100/80',
                    dragAreaVisable ? 'opacity-100' : '',
                  )}
                />
              </div>
            </TooltipTrigger>
          </ContextMenuTrigger>
          <TooltipContent>
            <Stack direction={'column'}>
              <Text>{title}</Text>
              <Text level="s" gray>
                {url}
              </Text>
              {/* <Stack direction={'rowr'} className="mt-2">
                <Button
                  variant={'link'}
                  className="text-red-600/80 h-4 w-0"
                  onClick={() => {
                    quickUrlItemsStorage.removeById(id)
                  }}>
                  del
                </Button>
                <Button variant={'link'} className="h-4 w-0" onClick={() => {}}>
                  edit
                </Button>
              </Stack> */}
            </Stack>
          </TooltipContent>
          <ContextMenuContent className="w-44">
            <ContextMenuItemWitchIcon IconType={Pencil} shortCut="Ctrl+E">
              Edit
            </ContextMenuItemWitchIcon>
            <ContextMenuItemWitchIcon className="text-red-800" IconType={Trash} shortCut="Ctrl+D">
              Delete
            </ContextMenuItemWitchIcon>
          </ContextMenuContent>
        </Tooltip>
      </ContextMenu>
    </TooltipProvider>
  )
}

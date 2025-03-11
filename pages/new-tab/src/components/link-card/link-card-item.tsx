import { cn } from '@/lib/utils'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Stack, Text, toast } from '@extension/ui'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItemWitchIcon,
} from '@extension/ui/lib/components/ui/context-menu'
import { useGlobalDialog } from '@src/provider'
import { Trash, Pencil } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'
import { QuickItemEditForm } from '@/src/components/quick-item-edit-form'
import type { QuickUrlItem } from '@extension/storage'
import { quickUrlItemsStorage } from '@extension/storage'
import { getDefaultIconUrl } from '@/lib/url'

interface LinkCardProps extends QuickUrlItem {}

export const LinkCardItem: FC<LinkCardProps & { className?: string }> = ({ url, title, id, iconUrl, className }) => {
  const [dragAreaVisable, setDragAreaVisible] = useState(false)
  const globalDialog = useGlobalDialog()
  return (
    <TooltipProvider>
      <Tooltip
        onOpenChange={opened => {
          setDragAreaVisible(opened)
        }}>
        <ContextMenu>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'relative min-w-[4.5rem] group flex flex-col items-center justify-center overflow-hidden p-2 gap-1 rounded-md duration-200',
                className,
              )}
              key={id}>
              <ContextMenuTrigger asChild>
                <div
                  className={cn(
                    'relative flex flex-row items-center justify-center rounded-md size-[4.5rem] text-primary active:bg-zinc-100/70 duration-200 cursor-pointer',
                    'bg-zinc-200/20 hover:bg-zinc-200/40',
                    'dark:hover:bg-zinc-100/40',
                  )}
                  onClick={ev => {
                    if (ev.ctrlKey) {
                      chrome.tabs.create({ url: url, active: true })
                    } else {
                      chrome.tabs.update({ url: url })
                    }
                  }}
                  aria-hidden="true">
                  <img src={getDefaultIconUrl(url)} alt="img" className="size-8 rounded-md" />
                </div>
              </ContextMenuTrigger>
              <Text level="s" className="select-none max-w-[6rem] line-clamp-1">
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
          <TooltipContent>
            <Stack direction={'column'}>
              <Text>{title}</Text>
              <Text
                level="s"
                gray
                className="cursor-pointer"
                onClick={() => {
                  toast.success('Copy success', { description: url })
                }}>
                {url}
              </Text>
            </Stack>
          </TooltipContent>
          <ContextMenuContent className="w-44">
            <ContextMenuItemWitchIcon
              IconType={Pencil}
              shortCut="Ctrl+E"
              onClick={() => {
                globalDialog.show(
                  <QuickItemEditForm
                    defaultValue={{ title, url }}
                    onSubmit={item => {
                      quickUrlItemsStorage.putById(id, {
                        id: id,
                        title: item.title,
                        url: item.url,
                      })
                      globalDialog.close()
                    }}
                    submitButtonTitle="Save"
                  />,
                  'Edit',
                )
              }}>
              Edit
            </ContextMenuItemWitchIcon>
            <ContextMenuItemWitchIcon
              className="text-red-800"
              IconType={Trash}
              shortCut="Ctrl+D"
              onClick={() => {
                globalDialog.confirm(`Continue delete ${title}?`, 'Delete can not recover', () => {
                  quickUrlItemsStorage.removeById(id)
                  globalDialog.close()
                })
              }}>
              Delete
            </ContextMenuItemWitchIcon>
          </ContextMenuContent>
        </ContextMenu>
      </Tooltip>
    </TooltipProvider>
  )
}

/* eslint-disable jsx-a11y/no-static-element-interactions */
import { getDefaultIconUrl } from '@/lib/url'
import { cn } from '@/lib/utils'
import { QuickItemEditForm } from '@/src/components/quick-item-edit-form'
import type { QuickUrlItem } from '@extension/storage'
import { quickUrlItemsStorage } from '@extension/storage'
import { Stack, Text, toast, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@extension/ui'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItemWitchIcon,
  ContextMenuTrigger,
} from '@extension/ui/lib/components/ui/context-menu'
import { useGlobalDialog } from '@src/provider'
import { Pencil, Trash } from 'lucide-react'
import type { CSSProperties, MouseEventHandler, Ref, TouchEventHandler } from 'react'
import { useRef, useState, forwardRef } from 'react'

import { MakeSortableItem } from '@/src/components/sortable-area'

interface LinkCardProps extends QuickUrlItem {
  ref?: Ref<HTMLDivElement>
}

interface CustomGridItemProps {
  onMouseDown?: MouseEventHandler
  onMouseUp?: MouseEventHandler
  onTouchEnd?: TouchEventHandler
  className?: string
  style?: CSSProperties
}

export const LinkCardItem = forwardRef<HTMLDivElement, LinkCardProps & CustomGridItemProps>(
  ({ url, title, id, iconUrl, className, onMouseDown, onMouseUp, onTouchEnd, style }, ref) => {
    const [dragAreaVisable, setDragAreaVisible] = useState(false)
    const globalDialog = useGlobalDialog()
    const innerRef = useRef<HTMLDivElement>(null)
    //const downingTime = useMouseDownTime(innerRef.current)

    return (
      <TooltipProvider>
        <Tooltip
          onOpenChange={opened => {
            setDragAreaVisible(opened)
          }}>
          <ContextMenu>
            <div
              style={style}
              className={cn(
                `relative min-w-[4.5rem] group flex flex-col items-center justify-center overflow-hidden p-2 gap-1
                rounded-md duration-200 cursor-default`,
                className,
              )}
              key={id}
              ref={ref}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onTouchEnd={onTouchEnd}>
              <TooltipTrigger asChild>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      `relative flex flex-row items-center justify-center rounded-lg size-[4.5rem] text-primary
                      duration-200 select-none cursor-pointer`,
                      'hover:bg-slate-200/40 active:bg-slate-100/70',
                      'dark:hover:bg-slate-100/20 dark:active:bg-slate-200/70',
                    )}
                    onClick={ev => {
                      if (ev.ctrlKey) {
                        chrome.tabs.create({ url: url, active: true })
                      } else {
                        chrome.tabs.update({ url: url })
                      }
                    }}
                    aria-hidden="true"
                    ref={innerRef}>
                    <img src={getDefaultIconUrl(url)} alt="img" className="size-8 rounded-md select-none" />
                  </div>
                </ContextMenuTrigger>
              </TooltipTrigger>
              <Text level="s" className="select-none line-clamp-1">
                {title}
              </Text>
            </div>
            <TooltipContent asChild>
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
                <Text>{id}</Text>
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
  },
)

LinkCardItem.displayName = 'LinkCardItem'

export const SortableLinkCardItem = MakeSortableItem(LinkCardItem)

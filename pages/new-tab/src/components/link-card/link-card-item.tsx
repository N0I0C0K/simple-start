/* eslint-disable jsx-a11y/no-static-element-interactions */
import { getDefaultIconUrl } from '@/lib/url'
import { cn } from '@/lib/utils'
import { QuickItemEditForm } from '@/src/components/quick-item-edit-form'
import { useMouseDownTime } from '@extension/shared'
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
import type { CSSProperties, FC, MouseEventHandler, Ref } from 'react'
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'

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
    const downingTime = useMouseDownTime(innerRef.current)

    return (
      <TooltipProvider>
        <Tooltip
          onOpenChange={opened => {
            setDragAreaVisible(opened)
          }}>
          <ContextMenu>
            <TooltipTrigger asChild>
              <div
                style={style}
                className={cn(
                  'relative min-w-[4.5rem] group flex flex-col items-center justify-center overflow-hidden p-2 gap-1 rounded-md duration-200',
                  className,
                )}
                key={id}
                ref={ref}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onTouchEnd={onTouchEnd}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      'relative flex flex-row items-center justify-center rounded-lg size-[4.5rem] text-primary active:bg-zinc-100/70 duration-200 cursor-pointer select-none',
                      'hover:bg-zinc-200/40',
                      'dark:hover:bg-zinc-100/40',
                    )}
                    onClick={ev => {
                      if (downingTime > 400) return
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
                <Text level="s" className="select-none line-clamp-1">
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

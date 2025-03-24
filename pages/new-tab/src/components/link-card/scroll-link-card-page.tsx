import { cn, useSize } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { quickUrlItemsStorage } from '@extension/storage'
import { useRef, type FC } from 'react'
import { LinkCardPage } from './link-card-page'
import { ScrollArea } from '@extension/ui'

export const ScrollLinkCardPage: FC<{ className?: string; maxRow?: number }> = ({ className, maxRow = 2 }) => {
  const rootDivRef = useRef<HTMLDivElement>(null)
  const size = useSize(rootDivRef)
  const userStorageItems = useStorage(quickUrlItemsStorage)

  return (
    <div ref={rootDivRef} className={cn(className, 'duration-300 p-1')}>
      <ScrollArea className="w-full" style={{ height: 260 }} scrollHideDelay={200}>
        <LinkCardPage
          boxSize={size}
          urlItems={userStorageItems}
          onUrlItemOrderChange={pageUrlItems => {
            quickUrlItemsStorage.updatePart(0, pageUrlItems)
          }}
        />
      </ScrollArea>
    </div>
  )
}

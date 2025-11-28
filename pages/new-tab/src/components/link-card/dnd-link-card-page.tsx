import { DragDropProvider, PointerSensor } from '@dnd-kit/react'
import { useStorage } from '@extension/shared'
import { quickUrlItemsStorage } from '@extension/storage'
import type { FC } from 'react'

import { SortabelLinkCardItem } from '@/src/components/link-card/link-card-item'
import { cn } from '@/lib/utils'

export const DndLinkCardPage: FC<{
  className?: string
}> = ({ className }) => {
  const userStorageItems = useStorage(quickUrlItemsStorage)

  return (
    <DragDropProvider
      sensors={[PointerSensor]}
      onDragEnd={event => {
        console.log(event)
        const { source, target } = event.operation
        if (target && source && source.id !== target.id) {
          quickUrlItemsStorage.moveItemById(source.id as string, target.id as string)
        }
      }}>
      <div
        className={cn('grid', className)}
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(6.5rem, 1fr))' }}>
        {userStorageItems.map((val, index) => (
          <SortabelLinkCardItem {...val} key={val.id} index={index} />
        ))}
      </div>
    </DragDropProvider>
  )
}

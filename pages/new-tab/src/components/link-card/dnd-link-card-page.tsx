import type { DragEndEvent } from '@dnd-kit/core'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useStorage } from '@extension/shared'
import { quickUrlItemsStorage } from '@extension/storage'
import type { FC } from 'react'

import { SortabelLinkCardItem } from '@/src/components/link-card/link-card-item'
import { cn } from '@/lib/utils'

export const DndLinkCardPage: FC<{
  className?: string
}> = ({ className }) => {
  const userStorageItems = useStorage(quickUrlItemsStorage)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={userStorageItems} strategy={rectSortingStrategy}>
        <div
          className={cn(
            'grid',
            className
          )}
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(6.5rem, 1fr))' }}
        >
          {userStorageItems.map(val => (
            <SortabelLinkCardItem {...val} key={val.id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )

  function handleDragEnd(event: DragEndEvent) {
    console.log(event)
    const { active, over } = event

    if (over && active.id !== over.id) {
      quickUrlItemsStorage.moveItemById(active.id as string, over.id as string)
    }
  }
}

import type { DragEndEvent } from '@dnd-kit/core'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useStorage } from '@extension/shared'
import { quickUrlItemsStorage } from '@extension/storage'
import { FC, useState } from 'react'

import { SortabelLinkCardItem } from '@/src/components/link-card/link-card-item'
import { cn } from '@/lib/utils'

export const DndLinkCardPage: FC<{
  className?: string
}> = ({ className }) => {
  const userStorageItems = useStorage(quickUrlItemsStorage)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={userStorageItems} strategy={rectSortingStrategy}>
        <div className={cn('grid md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7', className)}>
          {userStorageItems.map(val => (
            <SortabelLinkCardItem {...val} key={val.id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      quickUrlItemsStorage.moveItemById(active.id as string, over.id as string)
    }
  }
}

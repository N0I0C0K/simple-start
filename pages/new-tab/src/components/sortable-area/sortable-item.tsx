import type { ComponentType, FC, ReactNode } from 'react'

import { useSortable } from '@dnd-kit/sortable'

import { CSS } from '@dnd-kit/utilities'
import { DragOverlay, useDndContext } from '@dnd-kit/core'
import { createPortal } from 'react-dom'

export function SortableItem({ id, children }: { id: string | number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

export function MakeSortableItem<P>(Component: ComponentType<P>): FC<P & { id: string | number }> {
  const WarpSortableItem: FC<P & { id: string | number }> = props => {
    return (
      <SortableItem id={props.id}>
        <Component {...props} />
      </SortableItem>
    )
  }
  return WarpSortableItem
}

export function DraggableOverlay() {
  const { active } = useDndContext()

  return createPortal(<DragOverlay>{active ? <p>temp</p> : null}</DragOverlay>, document.body)
}

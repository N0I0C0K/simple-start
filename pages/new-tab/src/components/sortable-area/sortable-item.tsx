import type { ComponentType, FC, ReactNode } from 'react'

import { useSortable } from '@dnd-kit/sortable'

import { CSS } from '@dnd-kit/utilities'

export function SortableItem({ id, children }: { id: string | number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

import { DragDropProvider, PointerSensor } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { arrayMove } from '@dnd-kit/helpers'
import { useStorage } from '@extension/shared'
import { quickUrlItemsStorage, settingStorage } from '@extension/storage'
import { type FC, useMemo } from 'react'

import { SortableLinkCardItem } from '@/src/components/link-card/link-card-item'
import { cn } from '@/lib/utils'
import { useKeyboardNavigation } from './use-keyboard-navigation'

export const DndLinkCardPage: FC<{
  className?: string
}> = ({ className }) => {
  const userStorageItems = useStorage(quickUrlItemsStorage)
  const settings = useStorage(settingStorage)

  // Calculate grid columns based on the container
  const cols = useMemo(() => {
    // This is a rough estimate. In a real scenario, you might want to calculate this dynamically
    // based on container width. For now, we'll use a reasonable default of 6 columns.
    return 6
  }, [])

  const { selectedIndex } = useKeyboardNavigation({
    items: userStorageItems,
    enabled: settings.enableQuickUrlKeyboardNav,
    cols,
  })

  return (
    <DragDropProvider
      sensors={[
        PointerSensor.configure({
          activationConstraints: {
            delay: {
              tolerance: 4,
              value: 400,
            },
          },
        }),
      ]}
      onDragEnd={async event => {
        const { source } = event.operation
        if (isSortable(source)) {
          const { initialIndex, index } = source.sortable
          if (initialIndex !== index) {
            await quickUrlItemsStorage.set(pre => {
              return arrayMove(pre, initialIndex, index)
            })
          }
        }
      }}>
      <div className={cn('grid', className)} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(6.5rem, 1fr))' }}>
        {userStorageItems.map((val, index) => (
          <SortableLinkCardItem {...val} key={val.id} index={index} selected={selectedIndex === index} />
        ))}
      </div>
    </DragDropProvider>
  )
}

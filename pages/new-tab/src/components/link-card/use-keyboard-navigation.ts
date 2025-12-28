import { useHotkeys } from 'react-hotkeys-hook'
import { useState, useCallback, useEffect } from 'react'
import type { QuickUrlItem } from '@extension/storage'

interface UseKeyboardNavigationOptions {
  items: QuickUrlItem[]
  enabled: boolean
  /**
   * Container ref to calculate actual grid columns dynamically.
   * If provided, the hook will calculate the real column count based on the grid layout.
   */
  containerRef?: React.RefObject<HTMLElement>
}

export const useKeyboardNavigation = ({ items, enabled, containerRef }: UseKeyboardNavigationOptions) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [actualCols, setActualCols] = useState<number>(6) // Default fallback

  // Reset selection when items change or disabled
  useEffect(() => {
    if (!enabled || items.length === 0) {
      setSelectedIndex(-1)
    }
  }, [enabled, items.length])

  // Calculate actual column count from grid layout
  useEffect(() => {
    if (!containerRef?.current) return

    const calculateColumns = () => {
      const container = containerRef.current
      if (!container) return

      const children = container.children
      if (children.length < 2) {
        setActualCols(1)
        return
      }

      // Get the position of first two items to calculate columns
      const firstChild = children[0] as HTMLElement
      const secondChild = children[1] as HTMLElement
      
      if (!firstChild || !secondChild) return

      const firstRect = firstChild.getBoundingClientRect()
      const secondRect = secondChild.getBoundingClientRect()

      // If second item is on the same row (same top position), they're in different columns
      if (Math.abs(firstRect.top - secondRect.top) < 5) {
        // Count how many items are on the first row
        let cols = 1
        for (let i = 1; i < children.length; i++) {
          const rect = (children[i] as HTMLElement).getBoundingClientRect()
          if (Math.abs(rect.top - firstRect.top) < 5) {
            cols++
          } else {
            break
          }
        }
        setActualCols(cols)
      } else {
        // Items are stacked vertically, only 1 column
        setActualCols(1)
      }
    }

    // Initial calculation
    calculateColumns()

    // Recalculate on window resize
    const resizeObserver = new ResizeObserver(() => {
      calculateColumns()
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef, items.length])

  const handleNavigation = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!enabled || items.length === 0) return

      setSelectedIndex(prev => {
        // If nothing selected, start at first item
        if (prev === -1) {
          return 0
        }

        let newIndex = prev
        const maxIndex = items.length - 1

        switch (direction) {
          case 'left':
            newIndex = prev > 0 ? prev - 1 : prev
            break
          case 'right':
            newIndex = prev < maxIndex ? prev + 1 : prev
            break
          case 'up':
            newIndex = prev - actualCols >= 0 ? prev - actualCols : prev
            break
          case 'down':
            newIndex = prev + actualCols <= maxIndex ? prev + actualCols : prev
            break
        }

        return newIndex
      })
    },
    [enabled, items.length, actualCols],
  )

  const handleEnter = useCallback(() => {
    if (!enabled || selectedIndex === -1 || !items[selectedIndex]) return

    const item = items[selectedIndex]
    // Open URL in current tab with error handling
    chrome.tabs.update({ url: item.url }).catch(error => {
      console.error(
        `Failed to open quick URL "${item.title}" (${item.url}). ` +
          `This may be due to Chrome API permissions or an invalid URL format.`,
        error,
      )
    })
  }, [enabled, selectedIndex, items])

  // Bind arrow keys - prevent conflicts with command input
  // Using a combined handler to reduce duplication
  const handleArrowKey = useCallback(
    (e: KeyboardEvent, direction: 'up' | 'down' | 'left' | 'right') => {
      e.preventDefault()
      handleNavigation(direction)
    },
    [handleNavigation],
  )

  // Note: We must call useHotkeys separately for each key (hooks can't be in loops)
  useHotkeys('ArrowLeft', e => handleArrowKey(e, 'left'), { enabled, enableOnFormTags: false }, [handleArrowKey])
  useHotkeys('ArrowRight', e => handleArrowKey(e, 'right'), { enabled, enableOnFormTags: false }, [handleArrowKey])
  useHotkeys('ArrowUp', e => handleArrowKey(e, 'up'), { enabled, enableOnFormTags: false }, [handleArrowKey])
  useHotkeys('ArrowDown', e => handleArrowKey(e, 'down'), { enabled, enableOnFormTags: false }, [handleArrowKey])

  // Enter to open selected item
  useHotkeys(
    'Enter',
    e => {
      if (selectedIndex !== -1) {
        e.preventDefault()
        handleEnter()
      }
    },
    { enabled, enableOnFormTags: false },
    [handleEnter, selectedIndex],
  )

  // ESC to clear selection
  useHotkeys(
    'Escape',
    () => {
      setSelectedIndex(-1)
    },
    { enabled },
    [],
  )

  return {
    selectedIndex,
    setSelectedIndex,
  }
}

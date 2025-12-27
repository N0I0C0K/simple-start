import { useHotkeys } from 'react-hotkeys-hook'
import { useState, useCallback, useEffect } from 'react'
import type { QuickUrlItem } from '@extension/storage'

/**
 * Default column count for keyboard navigation grid.
 * This value of 6 works well for most screen sizes (1920px and above).
 * Note: The actual grid layout uses CSS auto-fit, so this is an approximation.
 * For perfect accuracy, this could be calculated dynamically using ResizeObserver.
 */
export const DEFAULT_GRID_COLS = 6

interface UseKeyboardNavigationOptions {
  items: QuickUrlItem[]
  enabled: boolean
  /**
   * Number of columns in the grid layout for keyboard navigation.
   * Defaults to 6, which works well for most screen sizes.
   * Note: This is an approximation since the actual grid uses auto-fit.
   * For perfect accuracy, this should be calculated dynamically using ResizeObserver.
   */
  cols?: number
}

export const useKeyboardNavigation = ({ items, enabled, cols = DEFAULT_GRID_COLS }: UseKeyboardNavigationOptions) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  // Reset selection when items change or disabled
  useEffect(() => {
    if (!enabled || items.length === 0) {
      setSelectedIndex(-1)
    }
  }, [enabled, items.length])

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
            newIndex = prev - cols >= 0 ? prev - cols : prev
            break
          case 'down':
            newIndex = prev + cols <= maxIndex ? prev + cols : prev
            break
        }

        return newIndex
      })
    },
    [enabled, items.length, cols],
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
  // Using a combined handler to avoid duplication
  const handleArrowKey = useCallback(
    (e: KeyboardEvent, direction: 'up' | 'down' | 'left' | 'right') => {
      e.preventDefault()
      handleNavigation(direction)
    },
    [handleNavigation],
  )

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

import { useHotkeys } from 'react-hotkeys-hook'
import { useState, useCallback, useEffect } from 'react'
import type { QuickUrlItem } from '@extension/storage'

interface UseKeyboardNavigationOptions {
  items: QuickUrlItem[]
  enabled: boolean
  cols?: number
}

export const useKeyboardNavigation = ({ items, enabled, cols = 6 }: UseKeyboardNavigationOptions) => {
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
      console.error(`Failed to open quick URL "${item.title}" (${item.url}):`, error)
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

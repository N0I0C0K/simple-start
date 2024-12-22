import type { QuickUrlItem } from '@extension/storage'
import { quickUrlItemsStorage, historySuggestStorage } from '@extension/storage'
import { useMemo } from 'react'
import { useStorage } from './useStorage'

export function useMixQuickUrlItems(): QuickUrlItem[] {
  const quickUrlItems = useStorage(quickUrlItemsStorage)
  const historySuggestItems = useStorage(historySuggestStorage)
  const historyNum = useMemo(() => {
    return Math.min(Math.max(0, 20 - quickUrlItems.length), historySuggestItems.length)
  }, [quickUrlItems, historySuggestItems])
  const items = useMemo(() => {
    return [...quickUrlItems, ...historySuggestItems.slice(0, historyNum)]
  }, [quickUrlItems, historySuggestItems, historyNum])
  return items
}

export function useSplitQuickUrlItems(historyItemsNum: number): {
  userStorage: QuickUrlItem[]
  historySuggest: QuickUrlItem[]
} {
  const quickUrlItems = useStorage(quickUrlItemsStorage)
  const historySuggestItems = useStorage(historySuggestStorage)
  const returnHistoryItems = useMemo(() => {
    return historySuggestItems.slice(0, historyItemsNum)
  }, [historyItemsNum, historySuggestItems])
  return {
    userStorage: quickUrlItems,
    historySuggest: returnHistoryItems,
  }
}

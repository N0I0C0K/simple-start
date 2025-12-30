import { useEffect, useState } from 'react'
import { getDomainFromUrl } from '@/lib/bookmarks'
import { useStorage } from '@extension/shared'
import { settingStorage } from '@extension/storage'

/**
 * Custom hook to fetch related open tabs when context menu opens
 */
export const useRelatedTabs = (url: string, contextMenuOpen: boolean) => {
  const [relatedTabs, setRelatedTabs] = useState<chrome.tabs.Tab[]>([])
  const settings = useStorage(settingStorage)

  useEffect(() => {
    if (contextMenuOpen && settings.showOpenTabsInQuickUrlMenu) {
      const domain = getDomainFromUrl(url)
      if (domain) {
        chrome.tabs
          .query({})
          .then(tabs => {
            // Filter tabs by matching domain
            const matchingTabs = tabs.filter(tab => {
              if (!tab.url) return false
              const tabDomain = getDomainFromUrl(tab.url)
              return tabDomain === domain && tab.url !== url // Exclude the current URL itself
            })
            setRelatedTabs(matchingTabs)
          })
          .catch(error => {
            console.error('Failed to fetch tabs:', error)
            setRelatedTabs([])
          })
      } else {
        // Clear tabs if domain extraction fails
        setRelatedTabs([])
      }
    } else {
      setRelatedTabs([])
    }
  }, [contextMenuOpen, url, settings.showOpenTabsInQuickUrlMenu])

  return { relatedTabs, showOpenTabs: settings.showOpenTabsInQuickUrlMenu }
}

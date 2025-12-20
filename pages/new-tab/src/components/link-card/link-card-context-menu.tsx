import { getDefaultIconUrl } from '@/lib/url'
import { QuickItemEditForm } from '@/src/components/quick-item-edit-form'
import { quickUrlItemsStorage } from '@extension/storage'
import {
  ContextMenuItem,
  ContextMenuItemWitchIcon,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@extension/ui/lib/components/ui/context-menu'
import type { GlobalDialogContextType } from '@src/provider'
import { Pencil, Trash } from 'lucide-react'
import { t } from '@extension/i18n'
import type { ReactNode } from 'react'

interface LinkCardContextMenuContentProps {
  id: string
  title: string
  url: string
  relatedBookmarks: chrome.bookmarks.BookmarkTreeNode[]
  showBookmarks: boolean
  globalDialog: GlobalDialogContextType
}

/**
 * LinkCardContextMenuContent - The context menu items (edit, delete, and bookmarks)
 * Returns an array of menu items to be placed inside ContextMenuContent
 */
export const LinkCardContextMenuContent = ({
  id,
  title,
  url,
  relatedBookmarks,
  showBookmarks,
  globalDialog,
}: LinkCardContextMenuContentProps): ReactNode => {
  return (
    <>
      <ContextMenuItemWitchIcon
        IconType={Pencil}
        shortCut="Ctrl+E"
        onClick={() => {
          globalDialog.show(
            <QuickItemEditForm
              defaultValue={{ title, url }}
              onSubmit={item => {
                quickUrlItemsStorage.putById(id, {
                  id: id,
                  title: item.title,
                  url: item.url,
                })
                globalDialog.close()
              }}
              submitButtonTitle="Save"
            />,
            'Edit',
          )
        }}>
        Edit
      </ContextMenuItemWitchIcon>
      <ContextMenuItemWitchIcon
        className="text-red-800"
        IconType={Trash}
        shortCut="Ctrl+D"
        onClick={() => {
          globalDialog.confirm(`Continue delete ${title}?`, 'Delete can not recover', () => {
            quickUrlItemsStorage.removeById(id)
            globalDialog.close()
          })
        }}>
        Delete
      </ContextMenuItemWitchIcon>

      {/* Related Bookmarks Section */}
      {showBookmarks && relatedBookmarks.length > 0 && (
        <>
          <ContextMenuSeparator />
          <ContextMenuLabel>{t('relatedBookmarks')}</ContextMenuLabel>
          {relatedBookmarks.slice(0, 10).map(bookmark => (
            <ContextMenuItem
              key={bookmark.id}
              onClick={() => {
                if (bookmark.url) {
                  chrome.tabs.update({ url: bookmark.url })
                }
              }}
              className="flex items-center gap-2">
              <img
                src={getDefaultIconUrl(bookmark.url || '')}
                alt={bookmark.title || bookmark.url || 'Bookmark icon'}
                className="size-4 rounded-sm flex-shrink-0"
                onError={e => {
                  // Fallback to hide broken images
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="truncate flex-1">{bookmark.title || bookmark.url}</span>
            </ContextMenuItem>
          ))}
        </>
      )}
    </>
  )
}

LinkCardContextMenuContent.displayName = 'LinkCardContextMenuContent'

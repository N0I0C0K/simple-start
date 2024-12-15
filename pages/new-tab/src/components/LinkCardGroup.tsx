import { useStorage } from '@extension/shared'
import { AddButton } from './AddButton'
import { LinkCard } from './LinkCard'
import { quickUrlItemsStorage, historySuggestStorage, QuickUrlItem, settingStorage } from '@extension/storage'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FC } from 'react'
import type { Layouts, Layout } from 'react-grid-layout'
import { Responsive } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import '@/src/style/placeholder.css'
import { cn, Stack } from '@extension/ui'
import { motion } from 'framer-motion'

const ReactGridLayout = Responsive

type Size = [x: number, y: number]

function useSize(ref: React.RefObject<Element>): Size {
  const [size, setSize] = useState<Size>([150, window.innerWidth / 2])
  useLayoutEffect(() => {
    if (!ref.current) return
    const obser = new ResizeObserver(ent => {
      const first = ent[0]
      setSize([first.contentRect.height, first.contentRect.width])
    })
    obser.observe(ref.current)
    return () => {
      obser.disconnect()
    }
  }, [ref])
  return size
}

async function sortItemByLayouts(layouts: Layout[], cols: number) {
  layouts.sort((lv, rv) => lv.x + lv.y * 1000 - (rv.x + rv.y * 1000))
  quickUrlItemsStorage.sortItemsByIds(layouts.map(val => val.i))
}

function useMixQuickUrlItems(): QuickUrlItem[] {
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

function useSplitQuickUrlItems(historyItemsNum: number): {
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

export const LinkCardGroup: FC = () => {
  // NOTE: MUST BE ORDERED BY SIZE DESC
  const breakpoints = useMemo(() => ({ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }), [])
  const cols = useMemo(() => ({ lg: 12, md: 10, sm: 8, xs: 6, xxs: 3 }), [])
  const ref = useRef(null)
  const size = useSize(ref)
  const [currentCols, setCols] = useState<number>(12)
  const userStorageItems = useStorage(quickUrlItemsStorage)
  const layouts = useMemo<Layouts>(() => {
    return Object.fromEntries(
      Object.entries(cols).map(([bk, col]) => [
        bk,
        userStorageItems.map((val, idx) => ({
          i: val.id,
          x: idx % col,
          y: Math.floor(idx / col),
          w: 1,
          h: 1,
          isResizable: false,
        })),
      ]),
    )
  }, [cols, userStorageItems])
  const maxRows = useMemo(() => {
    return Math.ceil(userStorageItems.length / currentCols)
  }, [userStorageItems, currentCols])
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // use to calculate the current cols for the initial layout
    const [, width] = size
    const curBp = Object.entries(breakpoints).find(([, bpSize]) => bpSize <= width)
    setCols(cols[(curBp?.[0] ?? 'md') as keyof typeof cols])
    setMounted(true)
  }, [])

  useEffect(() => {
    console.log(size)
  }, [size])
  return (
    <div
      ref={ref}
      className="relative backdrop-blur-2xl rounded-xl shadow-md dark:backdrop-brightness-75 duration-300 w-full overflow-hidden">
      <motion.div className="w-full" drag="x" dragConstraints={{ left: 0, right: 0 }}>
        <ReactGridLayout
          className={cn('w-full', mounted ? 'transition-transform' : 'transition-none')}
          layouts={layouts}
          breakpoints={breakpoints}
          cols={cols}
          compactType={'horizontal'}
          draggableHandle="#drag-area"
          onBreakpointChange={(nb, nc) => {
            setCols(nc)
          }}
          onLayoutChange={layout => {
            sortItemByLayouts(layout, currentCols)
          }}
          rowHeight={120}
          width={size[1]}
          useCSSTransforms={false}
          maxRows={maxRows}>
          {userStorageItems.map(val => (
            <div key={val.id}>
              <LinkCard {...val} key={val.id} />
            </div>
          ))}
        </ReactGridLayout>
      </motion.div>
      <AddButton className="absolute right-1 bottom-1 size-8" />
    </div>
  )
}

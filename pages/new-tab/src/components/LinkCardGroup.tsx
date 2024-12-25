import { useDebounce, useStorage } from '@extension/shared'
import { AddButton } from './AddButton'
import { LinkCard } from './LinkCard'
import type { QuickUrlItem } from '@extension/storage'
import { quickUrlItemsStorage, historySuggestStorage, settingStorage } from '@extension/storage'
import React, { useEffect, useMemo, useRef, useState, type FC } from 'react'
import type { Layouts, Layout } from 'react-grid-layout'
import { Responsive } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import '@/src/style/placeholder.css'
import { cn, Stack, TooltipProvider } from '@extension/ui'
import { motion } from 'framer-motion'
import type { Size } from '@/lib/utils'
import { useSize } from '@/lib/utils'
import { Carousel, CarouselContent, CarouselItem } from '@extension/ui/lib/components/ui/carousel'

import { chunk } from 'lodash'

const ReactGridLayout = Responsive

function sortItemByLayouts(layouts: Layout[], urlItems: QuickUrlItem[]) {
  layouts.sort((lv, rv) => lv.x + lv.y * 1000 - (rv.x + rv.y * 1000))
  const ids = layouts.map(val => val.i)
  const idAndPriorityMapping = new Map(ids.map((val, idx) => [val, idx]))
  return urlItems.sort(
    (lv, rv) => (idAndPriorityMapping.get(lv.id) ?? 10000) - (idAndPriorityMapping.get(rv.id) ?? 10000),
  )
}

type commonLayoutLike = {
  lg: number
  md: number
  sm: number
  xs: number
  xxs: number
}

type PageProps = {
  urlItems: QuickUrlItem[]
  firstItemIndexOfRoot: number
  pageIndex: number
}

// NOTE: MUST BE ORDERED BY SIZE DESC
const commonBreakpoints: commonLayoutLike = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const commonCols: commonLayoutLike = { lg: 12, md: 10, sm: 8, xs: 6, xxs: 3 }
const commonMaxRows: commonLayoutLike = { lg: 2, md: 2, sm: 2, xs: 3, xxs: 4 }
const commonMaxRowsForEachPage = 10

const LinkCardPage: FC<{
  boxSize: Size
  urlItems: QuickUrlItem[]
  onUrlItemDragStart?: () => void
  onUrlItemDragEnd?: () => void
  onUrlItemOrderChange?: (urlItems: QuickUrlItem[]) => void
}> = ({ boxSize, urlItems, onUrlItemDragEnd, onUrlItemDragStart, onUrlItemOrderChange }) => {
  const [currentCols, setCols] = useState<number>(12)
  const [mounted, setMounted] = useState(false)
  const [urlItemsState, setUrlItems] = useState(urlItems)

  const layouts = useMemo<Layouts>(() => {
    return Object.fromEntries(
      Object.entries(commonCols).map(([bk, col]) => [
        bk,
        urlItemsState.map((val, idx) => ({
          i: val.id,
          x: idx % col,
          y: Math.floor(idx / col),
          w: 1,
          h: 1,
          isResizable: false,
        })),
      ]),
    )
  }, [urlItemsState])
  const maxRows = useMemo(() => {
    return Math.min(Math.ceil(urlItemsState.length / currentCols), commonMaxRowsForEachPage)
  }, [currentCols, urlItemsState])

  useEffect(() => {
    // use to calculate the current cols for the initial layout
    const [, width] = boxSize
    const curBp = Object.entries(commonBreakpoints).find(([, bpSize]) => bpSize <= width)
    setCols(commonCols[(curBp?.[0] ?? 'md') as keyof typeof commonCols])
    setMounted(true)
  }, [])

  useEffect(() => {
    setUrlItems(urlItems)
  }, [urlItems])

  return (
    <ReactGridLayout
      className={cn('w-full', mounted ? 'transition-transform' : 'transition-none')}
      layouts={layouts}
      breakpoints={commonBreakpoints}
      cols={commonCols}
      compactType={'horizontal'}
      draggableHandle="#drag-area"
      onBreakpointChange={(nb, nc) => {
        setCols(nc)
      }}
      onLayoutChange={layout => {
        setUrlItems(val => sortItemByLayouts(layout, val))
        onUrlItemOrderChange?.(urlItemsState)
      }}
      rowHeight={120}
      width={boxSize[1]}
      useCSSTransforms={false}
      maxRows={maxRows}
      onDragStart={onUrlItemDragStart}
      onDragStop={() => {
        onUrlItemDragEnd?.()
      }}>
      {urlItemsState.map(val => (
        <div key={val.id}>
          <LinkCard {...val} key={val.id} />
        </div>
      ))}
    </ReactGridLayout>
  )
}

export const LinkCardGroup: FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const size = useSize(ref)
  const [hasItemDragging, setHasItemDragging] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<keyof commonLayoutLike>(() => {
    const [, width] = size
    const curBp = Object.entries(commonBreakpoints).find(([, bpSize]) => bpSize <= width)
    return (curBp?.[0] ?? 'md') as keyof commonLayoutLike
  })
  const userStorageItems = useStorage(quickUrlItemsStorage)
  const pageMaxItems = useMemo(() => {
    return commonCols[currentLayout] * commonMaxRows[currentLayout]
  }, [currentLayout])
  const pages: PageProps[] = useMemo(() => {
    return chunk(userStorageItems, pageMaxItems).map<PageProps>((val, idx) => {
      return {
        urlItems: val,
        firstItemIndexOfRoot: pageMaxItems * idx,
        pageIndex: idx,
      }
    })
  }, [userStorageItems, pageMaxItems])

  const delaySize = useDebounce(size, 50)

  useEffect(() => {
    const [, width] = delaySize
    const curBp = Object.entries(commonBreakpoints).find(([, bpSize]) => bpSize <= width)
    setCurrentLayout((curBp?.[0] ?? 'md') as keyof commonLayoutLike)
  }, [delaySize])

  return (
    <div
      ref={ref}
      className="relative backdrop-blur-2xl rounded-xl shadow-md dark:backdrop-brightness-75 duration-300 w-full overflow-hidden">
      <Carousel className="w-full" opts={{ duration: 50, watchDrag: !hasItemDragging }}>
        <CarouselContent>
          {pages.map(page => {
            return (
              <CarouselItem key={page.pageIndex}>
                <LinkCardPage
                  boxSize={size}
                  urlItems={page.urlItems}
                  onUrlItemDragStart={() => {
                    setHasItemDragging(true)
                  }}
                  onUrlItemDragEnd={() => {
                    setHasItemDragging(false)
                  }}
                  onUrlItemOrderChange={pageUrlItems => {
                    quickUrlItemsStorage.updatePart(page.firstItemIndexOfRoot, pageUrlItems)
                  }}
                />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
      <AddButton className="absolute right-1 bottom-1 size-8" />
    </div>
  )
}

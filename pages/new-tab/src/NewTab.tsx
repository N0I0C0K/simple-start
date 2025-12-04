import '@src/NewTab.css'
import { Center, Input, Text, Heading, Stack } from '@extension/ui'
import { Search, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { CommandModule, SettingPanel, ScrollLinkCardPage } from './components'

import '@/src/style/placeholder.css'
import { HistoryArea } from './components/history-area'
import { settingStorage, DEFAULT_WALLPAPER_URL, type TimeDisplaySize } from '@extension/storage'
import { useStorage } from '@extension/shared'
import { DrinkWaterEventMountComponent } from './components/events'
import { t } from '@extension/i18n'

function SearchGroup() {
  const settings = useStorage(settingStorage)
  const [searchText, setSearchText] = useState('')
  const searchFunc = useCallback(async (text: string) => {
    await chrome.search.query({ text: text, disposition: 'NEW_TAB' })
  }, [])
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    window.addEventListener('keydown', ev => {
      if (ev.altKey && ev.code == 'KeyK') {
        inputRef.current?.focus()
      }
    })
  }, [])
  return (
    <div className="w-[40%] min-w-[20rem] max-w-[40rem]">
      <div className="relative">
        <Input
          ref={inputRef}
          id="input-26"
          className="peer pe-9 ps-10 rounded-full h-12 font-medium shadow-md"
          placeholder={t('searchPlaceholder')}
          type="search"
          value={searchText}
          onChange={ev => {
            setSearchText(ev.target.value)
          }}
          onKeyDown={ev => {
            if (ev.key == 'Enter') {
              searchFunc(searchText)
            }
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 start-1 flex items-center justify-center ps-3
            text-muted-foreground/80 peer-disabled:opacity-50">
          <Search size={16} strokeWidth={3} />
        </div>

        <button
          className="absolute inset-y-0 end-1 flex h-full w-9 items-center justify-center rounded-e-lg
            text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border
            focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none
            disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('submitSearch')}
          type="submit"
          onClick={() => {
            searchFunc(searchText)
          }}>
          <ArrowRight size={16} strokeWidth={3} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

const TimeDisplay = () => {
  const settings = useStorage(settingStorage)
  const [time, setTime] = useState<Date>(new Date())
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  useEffect(() => {
    const timeNow = new Date()
    setTime(timeNow)

    const offset = 60000 - (timeNow.getTime() % 60000)
    const timerId = setTimeout(() => {
      setRefreshTrigger(val => val + 1)
    }, offset)

    return () => {
      clearTimeout(timerId)
    }
  }, [refreshTrigger])

  const sizeStyles = useMemo(() => {
    const size: TimeDisplaySize = settings.timeDisplaySize || 'large'
    const styles: Record<
      TimeDisplaySize,
      { timeClass: string; dotSize: number; dotSpacing: number; dateClass: string; containerPadding: string }
    > = {
      small: {
        timeClass: 'text-5xl',
        dotSize: 4,
        dotSpacing: 8,
        dateClass: 'text-sm',
        containerPadding: 'px-3',
      },
      medium: {
        timeClass: 'text-7xl',
        dotSize: 5,
        dotSpacing: 10,
        dateClass: 'text-base',
        containerPadding: 'px-4',
      },
      large: {
        timeClass: 'text-9xl',
        dotSize: 6,
        dotSpacing: 12,
        dateClass: 'text-lg',
        containerPadding: 'px-5',
      },
    }
    return styles[size]
  }, [settings.timeDisplaySize])

  return (
    <Stack direction={'column'} className="items-center gap-3">
      <Stack className="items-center gap-0">
        <Heading className={`${sizeStyles.timeClass} select-none font-light tracking-tight`}>
          {time?.getHours().toString().padStart(2, '0')}
        </Heading>
        <div className={`flex flex-col items-center justify-center ${sizeStyles.containerPadding}`} style={{ gap: `${sizeStyles.dotSpacing}px` }}>
          <div
            className="rounded-full bg-current opacity-80"
            style={{ width: `${sizeStyles.dotSize}px`, height: `${sizeStyles.dotSize}px` }}
          />
          <div
            className="rounded-full bg-current opacity-80"
            style={{ width: `${sizeStyles.dotSize}px`, height: `${sizeStyles.dotSize}px` }}
          />
        </div>
        <Heading className={`${sizeStyles.timeClass} select-none font-light tracking-tight`}>
          {time?.getMinutes().toString().padStart(2, '0')}
        </Heading>
      </Stack>
      <Text className={`font-medium select-none text-primary/70 tracking-wide ${sizeStyles.dateClass}`}>
        {time.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'long' })}
      </Text>
    </Stack>
  )
}

const NewTab = () => {
  const settings = useStorage(settingStorage)
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(settings.wallpaperUrl ?? DEFAULT_WALLPAPER_URL)
  useEffect(() => {
    setWallpaperUrl(settings.wallpaperUrl ?? DEFAULT_WALLPAPER_URL)
  }, [settings.wallpaperUrl])
  return (
    <>
      <div className={'flex h-screen w-screen max-w-full flex-col justify-center gap-4 relative overflow-hidden'}>
        <Center column className="flex-1">
          <TimeDisplay />
        </Center>
        <Stack direction={'column'} className="flex-1">
          <Center className="mb-8 h-10">
            <CommandModule className="w-[40%] min-w-[20rem] max-w-[40rem] h-auto absolute z-[1]" />
          </Center>
          <Center>
            <div className="relative min-w-[20rem] w-[50%] z-0">
              <ScrollLinkCardPage
                className="relative backdrop-blur-2xl rounded-2xl shadow-md dark:backdrop-brightness-75 w-full
                  overflow-hidden bg-slate-50/15 dark:bg-slate-700/5 z-0"
              />
              {/* <DndLinkCardPage className="relative backdrop-blur-2xl rounded-2xl shadow-md dark:backdrop-brightness-75 w-full overflow-hidden bg-slate-50/20 dark:bg-slate-700/20" /> */}
            </div>
          </Center>
        </Stack>
        {settings.useHistorySuggestion ? (
          <Stack direction={'column'} className="flex-1 flex flex-col justify-end">
            <HistoryArea
              className="backdrop-blur-2xl rounded-t-xl shadow-md dark:backdrop-brightness-75 bg-slate-50/20
                dark:bg-slate-700/20"
            />
          </Stack>
        ) : (
          <div style={{ flexGrow: 0.7 }} />
        )}
      </div>
      <img
        className="x-bg-img h-screen w-screen fixed top-0 left-0 -z-10 scale-105 brightness-90 dark:brightness-75
          object-cover select-none"
        src={wallpaperUrl}
        alt=""
        onError={e => {
          console.log('back ground err')
          if (wallpaperUrl !== DEFAULT_WALLPAPER_URL) setWallpaperUrl(DEFAULT_WALLPAPER_URL)
        }}
      />
      <SettingPanel className="fixed top-2 right-2" />
      <DrinkWaterEventMountComponent />
    </>
  )
}

export default NewTab

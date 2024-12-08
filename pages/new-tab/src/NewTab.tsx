import '@src/NewTab.css'
import { Center, Input, Text, Heading, Stack } from '@extension/ui'
import { Search, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LinkCardGroup, SettingPanel } from './components'

function SearchGroup() {
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
    <div className=" w-[40%] min-w-[20rem] max-w-[40rem]">
      <div className="relative">
        <Input
          ref={inputRef}
          id="input-26"
          className="peer pe-9 ps-10 rounded-full h-12 font-medium shadow-md"
          placeholder="Search..."
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
        <div className="pointer-events-none absolute inset-y-0 start-1 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <Search size={16} strokeWidth={3} />
        </div>
        <button
          className="absolute inset-y-0 end-1 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Submit search"
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

  return (
    <Stack direction={'column'} className="items-center">
      <Stack className="items-end">
        <Heading className="text-8xl select-none">{time?.getHours().toString().padStart(2, '0')}</Heading>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 6 24"
          fill="none"
          stroke="currentColor"
          className="w-4 h-20 fill-current stroke-10 mx-1">
          <circle cx="3" cy="17" r="2" />
          <circle cx="3" cy="7" r="2" />
        </svg>
        <Heading className="text-8xl select-none">{time?.getMinutes().toString().padStart(2, '0')}</Heading>
      </Stack>
      <Text className="font-semibold select-none text-primary/80">
        {time.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'long' })}
      </Text>
    </Stack>
  )
}

const NewTab = () => {
  return (
    <>
      <div className={'flex h-screen w-screen max-w-full flex-col justify-center gap-4 relative'}>
        <Center column className="flex-1">
          <TimeDisplay />
        </Center>
        <Stack direction={'column'} className="flex-1">
          <Center className="mb-8">
            <SearchGroup />
          </Center>
          <Center>
            <LinkCardGroup />
          </Center>
        </Stack>
        <span className="flex-1" />
      </div>
      <img
        className="x-bg-img h-screen w-screen fixed top-0 left-0 -z-10 blur-sm brightness-90 scale-105 dark:brightness-75 object-cover"
        src="https://w.wallhaven.cc/full/2y/wallhaven-2yxp16.jpg"
        alt=""
        onError={e => {
          console.log('back ground err')
        }}
      />
      <SettingPanel className="fixed top-2 right-2" />
    </>
  )
}

export default NewTab

import '@src/NewTab.css'
import {
  Button,
  Center,
  Input,
  Text,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Heading,
  Stack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Label,
} from '@extension/ui'
import { Plus, Search, ArrowRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FC } from 'react'
import { useStorage } from '@extension/shared'
import { quickUrlItemsStorage } from '@extension/storage'

const AddButton = () => {
  return (
    <div className="p-2">
      <Popover>
        <Center column>
          <PopoverTrigger asChild>
            <Button size={'icon'} variant={'ghost'}>
              <Plus />
            </Button>
          </PopoverTrigger>
        </Center>
        <PopoverContent className="">
          <Stack direction={'column'} className="gap-2">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" defaultValue="" className="h-8" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="title">Url</Label>
              <Input id="Url" defaultValue="" className="h-8" />
            </div>
            <Button className="mt-4">Add</Button>
          </Stack>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface LinkCardProps {
  url: string
  title: string
}

const LinkCard: FC<LinkCardProps> = ({ url, title }) => {
  const urlParsed = useMemo(() => {
    return new URL(url)
  }, [url])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className="group flex flex-col items-center justify-center overflow-hidden p-2 gap-1 cursor-pointer rounded-md duration-200"
            onClick={() => {
              chrome.tabs.create({ url: url })
            }}
            aria-hidden="true">
            <div className="flex flex-row items-center justify-center rounded-md size-20 text-primary bg-zinc-200/20 group-hover:bg-zinc-100/40 group-active:bg-zinc-100/70 duration-200">
              <img src={`${urlParsed.origin}/favicon.ico`} alt="img" />
            </div>
            <Text level="s">{title}</Text>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <Stack direction={'column'}>
            <Text>{title}</Text>
            <Text level="s" gray>
              {url}
            </Text>
          </Stack>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// const SearchGroup = () => {
//   const [searchText, setSearchText] = useState('')
//   return (
//     <div className="flex flex-row gap-4 p-4 w-[40%] self-center min-w-[20rem]">
//       <Input
//         className="rounded-full shadow-md"
//         placeholder="为什么地球是圆的"
//         value={searchText}
//         onChange={ev => {
//           setSearchText(ev.target.value)
//         }}></Input>
//       <Button
//         variant={'default'}
//         className="rounded-full shadow-md"
//         onClick={() => {
//           chrome.search.query({ text: searchText, disposition: 'NEW_TAB' })
//         }}>
//         Search
//       </Button>
//     </div>
//   )
// }

function SearchGroup() {
  return (
    <div className=" w-[40%] min-w-[20rem] max-w-[40rem]">
      <div className="relative">
        <Input id="input-26" className="peer pe-9 ps-9 rounded-full" placeholder="Search..." type="search" />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <Search size={16} strokeWidth={2} />
        </div>
        <button
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Submit search"
          type="submit">
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function getCurrentTimeAndOffsetToNextMinute(): { datetime: Date; offset: number } {
  const now = new Date()
  const offset = 60000 - (now.getUTCMilliseconds() % 60000)
  return { datetime: now, offset }
}

const TimeDisplay = () => {
  const [time, setTime] = useState<Date>(new Date())

  return (
    <Stack direction={'column'} className="items-center">
      <Stack className="items-end">
        <Heading className="text-8xl select-none">{time?.getHours()}</Heading>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 6 24"
          fill="none"
          stroke="currentColor"
          className="w-4 h-20 fill-current stroke-10 mx-1">
          <circle cx="3" cy="17" r="2" />
          <circle cx="3" cy="7" r="2" />
        </svg>
        <Heading className="text-8xl select-none">{time?.getMinutes()}</Heading>
      </Stack>
      <Text className="font-semibold select-none text-primary/80">
        {time.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'long' })}
      </Text>
    </Stack>
  )
}

const NewTab = () => {
  const quickUrlItems = useStorage(quickUrlItemsStorage)
  return (
    <>
      <div className={'flex h-screen w-screen flex-col justify-center gap-4 relative'}>
        <Center column className="flex-1">
          <TimeDisplay />
        </Center>
        <Stack direction={'column'} className="flex-1">
          <Center className="mb-20">
            <SearchGroup />
          </Center>
          <Center>
            <div className="grid lg:grid-cols-8 md:grid-cols-6 sm:grid-cols-3 backdrop-blur-lg gap-3 p-4 rounded-xl shadow-sm dark:backdrop-brightness-75 duration-300">
              {quickUrlItems.map(val => (
                <LinkCard title={val.title} url={val.url} key={val.id} />
              ))}
              <AddButton />
            </div>
          </Center>
        </Stack>
        <span className="flex-1" />
      </div>
      <div
        className="h-screen w-screen fixed top-0 left-0 -z-10 blur-sm brightness-90 scale-105 duration-300 dark:brightness-75"
        style={{ background: "url('https://w.wallhaven.cc/full/2y/wallhaven-2yxp16.jpg') center" }}
      />
    </>
  )
}

export default NewTab

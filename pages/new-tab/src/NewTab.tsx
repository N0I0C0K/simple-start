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
} from '@extension/ui'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState, type FC } from 'react'

const AddButton = () => {
  return (
    <Button size={'icon'}>
      <Plus />
    </Button>
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
    <Tooltip>
      <TooltipTrigger>
        <div
          className="flex flex-col items-center justify-center overflow-hidden p-2 gap-1 cursor-pointer rounded-md hover:-translate-y-2 duration-200"
          onClick={() => {
            chrome.tabs.create({ url: url })
          }}
          aria-hidden="true">
          <div className="flex flex-row items-center justify-center rounded-md size-20 text-primary bg-zinc-200/20">
            <img src={`${urlParsed.origin}/favicon.ico`} alt="img" />
          </div>
          <Text level="s">{title}</Text>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <Text>{url}</Text>
      </TooltipContent>
    </Tooltip>
  )
}

const SearchGroup = () => {
  const [searchText, setSearchText] = useState('')
  return (
    <div className="flex flex-row gap-4 p-4 w-[40%] self-center min-w-[20rem]">
      <Input
        className="rounded-full shadow-md"
        placeholder="为什么地球是圆的"
        value={searchText}
        onChange={ev => {
          setSearchText(ev.target.value)
        }}></Input>
      <Button
        variant={'default'}
        className="rounded-full shadow-md"
        onClick={() => {
          chrome.search.query({ text: searchText, disposition: 'NEW_TAB' })
        }}>
        Search
      </Button>
    </div>
  )
}

const TimeDisplay = () => {
  return (
    <div className="flex flex-row">
      <Heading className="text-8xl">18</Heading>
      <Heading className="text-8xl animate-blink">:</Heading>
      <Heading className="text-8xl">32</Heading>
    </div>
  )
}

const TestUrls: LinkCardProps[] = [
  {
    title: '哔哩哔哩',
    url: 'https://www.bilibili.com/',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
  {
    title: 'Github',
    url: 'https://github.com/N0I0C0K',
  },
]

const NewTab = () => {
  return (
    <>
      <div className={'flex h-screen w-screen flex-col justify-center gap-4 relative'}>
        <Center column className="flex-1">
          <TimeDisplay />
        </Center>
        <Stack direction={'column'} className="flex-1">
          <Center className="mb-4">
            <SearchGroup />
          </Center>
          <Center>
            <div className="grid grid-cols-8 backdrop-blur-lg gap-3 p-4 rounded-md shadow-sm dark:backdrop-brightness-75 duration-300">
              {TestUrls.map(val => (
                <LinkCard title={val.title} url={val.url} key={val.title} />
              ))}
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

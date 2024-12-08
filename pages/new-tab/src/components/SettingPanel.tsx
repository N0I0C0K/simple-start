import { cn } from '@/lib/utils'
import {
  Button,
  Heading,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Space,
  Stack,
  Text,
  ThemeToggle,
  Switch,
} from '@extension/ui'
import type { LucideProps } from 'lucide-react'
import { AlignJustify, SunMoon, History, HardDriveUpload } from 'lucide-react'
import type { ElementType, FC, ReactElement } from 'react'

const SettingItem: FC<{
  className?: string
  title: string
  description?: string
  control: ReactElement
  IconClass: ElementType<LucideProps>
}> = ({ control, title, className, description, IconClass }) => {
  return (
    <Stack
      direction={'row'}
      className="items-center overflow-hidden relative rounded-md p-3 bg-slate-200/20 dark:bg-slate-800/20">
      <IconClass strokeWidth={1} className="size-16 mr-2 absolute -left-6 text-slate-400/60" />
      <Stack direction={'column'} className="ml-10">
        <Text className="font-medium" level="md">
          {title}
        </Text>
        <Text gray className="-mt-1 max-w-[20em]" level="s">
          {description}
        </Text>
      </Stack>
      <Space />
      {control}
    </Stack>
  )
}

export const SettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size={'icon'} variant={'ghost'} className={cn('rounded-full', className)}>
          <AlignJustify />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[30rem] p-6">
        <Stack direction={'column'} className="gap-2">
          <Stack direction={'column'} className="mb-2">
            <Heading className="font-medium">Settings</Heading>
            <Text gray className="-mt-1" level="s">
              All Settings are stored locally to ensure data security
            </Text>
          </Stack>
          <SettingItem
            IconClass={SunMoon}
            title="Theme"
            description="Change dark/light theme."
            control={<ThemeToggle />}
          />
          <SettingItem
            IconClass={History}
            title="History Suggestion"
            description="Use history for recommendations."
            control={<Switch />}
          />
          <SettingItem
            IconClass={HardDriveUpload}
            title="Multi-Device Sync"
            description="Use Google to store your Settings for multiple syncs."
            control={<Switch />}
          />
        </Stack>
      </PopoverContent>
    </Popover>
  )
}

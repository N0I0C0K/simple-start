import { cn } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { settingStorage } from '@extension/storage'
import {
  Button,
  Heading,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  Space,
  Stack,
  Text,
  ThemeToggle,
  Switch,
  Input,
  DrawerClose,
} from '@extension/ui'
import type { LucideProps } from 'lucide-react'
import { AlignJustify, SunMoon, History, HardDriveUpload, FileImage, Edit, X } from 'lucide-react'
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
      className={cn(
        'items-center overflow-hidden relative rounded-md p-3 bg-slate-200/20 border-slate-400/20',
        'dark:bg-slate-800/20 border dark:border-slate-600/20',
        className,
      )}>
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

const SettingContent: FC<{
  className?: string
}> = ({ className }) => {
  const settings = useStorage(settingStorage)
  return (
    <Stack direction={'column'} className={cn('gap-2 w-full h-full', className)}>
      <Stack direction={'column'} className="mb-2">
        <Heading className="font-medium">Settings</Heading>
        <Text gray className="-mt-1" level="s">
          All Settings are stored locally to ensure data security
        </Text>
      </Stack>
      <SettingItem IconClass={SunMoon} title="Theme" description="Change dark/light theme." control={<ThemeToggle />} />
      <SettingItem
        IconClass={FileImage}
        title="Backgroud Image"
        description="Personalized background picture"
        control={
          <Button size={'icon'} variant={'ghost'}>
            <Edit />
          </Button>
        }
      />
      <SettingItem
        IconClass={History}
        title="History Suggestion"
        description="Use history for recommendations."
        control={
          <Switch
            checked={settings.useHistorySuggestion}
            onCheckedChange={val => settingStorage.update({ useHistorySuggestion: val })}
          />
        }
      />
    </Stack>
  )
}

export const SettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    // <Popover>
    //   <PopoverTrigger asChild>
    //     <Button size={'icon'} variant={'ghost'} className={cn('rounded-full', className)}>
    //       <AlignJustify />
    //     </Button>
    //   </PopoverTrigger>
    //   <PopoverContent className="min-w-[30rem] p-6">
    //     <SettingContent />
    //   </PopoverContent>
    // </Popover>
    <Drawer direction="right" shouldScaleBackground>
      <DrawerTrigger asChild>
        <Button size={'icon'} variant={'ghost'} className={cn('rounded-full', className)}>
          <AlignJustify />
        </Button>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 z-10 bg-black/40" />
        <DrawerContent
          className="right-2 top-2 bottom-2 fixed z-20 outline-none w-[30rem] flex"
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}>
          <SettingContent className="rounded-xl bg-background p-4" />
          <DrawerClose asChild>
            <Button size={'icon'} variant={'ghost'} className="absolute top-3 right-3 rounded-full">
              <X />
            </Button>
          </DrawerClose>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}

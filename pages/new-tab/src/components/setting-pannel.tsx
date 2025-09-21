import { cn } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { settingStorage } from '@extension/storage'
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerPortal,
  Space,
  Stack,
  Text,
  ThemeToggle,
  Switch,
  Input,
} from '@extension/ui'
import type { LucideProps } from 'lucide-react'
import { AlignJustify, Send, SunMoon, History, HardDriveUpload, Pointer } from 'lucide-react'
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
        'bg-muted',
        className,
      )}>
      <IconClass strokeWidth={1} className="size-16 mr-2 absolute -left-6 text-slate-400" />
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

const CommonSettings: FC = () => {
  const settings = useStorage(settingStorage)
  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      <SettingItem IconClass={SunMoon} title="Theme" description="Change dark/light theme." control={<ThemeToggle />} />
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
      <SettingItem
        IconClass={Pointer}
        title="Auto Focus Command Input"
        description="Auto focus command input."
        control={
          <Switch
            checked={settings.autoFocusCommandInput}
            onCheckedChange={val => settingStorage.update({ autoFocusCommandInput: val })}
          />
        }
      />
      <SettingItem
        IconClass={HardDriveUpload}
        title="Wallpaper URL"
        description="Set a custom wallpaper URL."
        control={
          <Input
            placeholder="Enter wallpaper URL"
            value={settings.wallpaperUrl || ''}
            onChange={e => settingStorage.update({ wallpaperUrl: e.target.value })}
          />
        }
      />
    </Stack>
  )
}

const DrawerSettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <Drawer direction="right" shouldScaleBackground>
      <DrawerTrigger asChild>
        <Button size={'icon'} variant={'ghost'} className={cn('rounded-full', className)}>
          <AlignJustify />
        </Button>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerContent className="right-2 top-2 fixed z-20 outline-none w-[35rem] flex">
          <div className="bg-background w-full h-full p-6 rounded-lg shadow-lg">
            <CommonSettings />
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}

const ActionPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <Drawer direction="right" shouldScaleBackground>
      <DrawerTrigger asChild>
        <Button size={'icon'} variant={'ghost'} className={cn('rounded-full', className)}>
          <Send />
        </Button>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerContent className="right-2 top-2 fixed z-20 outline-none w-[4rem] flex">
          <Stack direction={'column'} className="bg-background w-full h-full p-6 rounded-lg shadow-lg">
            <Button size={'icon'} variant={'ghost'} className={cn('rounded-full', className)}>
              <Send />
            </Button>
          </Stack>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}

export const SettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <Stack direction={'column'} className={className}>
      <DrawerSettingPanel />
      <ActionPanel />
    </Stack>
  )
}

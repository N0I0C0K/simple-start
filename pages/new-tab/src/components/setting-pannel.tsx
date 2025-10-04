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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  toast,
  TooltipButton,
} from '@extension/ui'
import type { LucideProps } from 'lucide-react'
import { AlignJustify, Send, SunMoon, History, HardDriveUpload, Pointer, Check, X } from 'lucide-react'
import type { ElementType, FC, ReactElement, ReactNode } from 'react'

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

const SidebarButton: FC<{
  className?: string
  IconClass: ElementType<LucideProps>
  children: ReactNode
  label: string
}> = ({ className, IconClass, children, label }) => {
  return (
    <Drawer direction="right" shouldScaleBackground>
      <Tooltip>
        <DrawerTrigger asChild>
          <TooltipTrigger asChild>
            <Button size={'icon'} variant={'ghost'} className={cn('rounded-full')}>
              <IconClass />
            </Button>
          </TooltipTrigger>
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerContent className={cn('right-2 top-2 fixed z-20 outline-none flex', className)}>
            {children}
          </DrawerContent>
        </DrawerPortal>
        <TooltipContent side="left">
          <Text>{label}</Text>
        </TooltipContent>
      </Tooltip>
    </Drawer>
  )
}

const DrawerSettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <SidebarButton IconClass={AlignJustify} label="Settings">
      <div className="bg-background w-full h-full p-6 rounded-lg shadow-lg">
        <CommonSettings />
      </div>
    </SidebarButton>
  )
}

const CupPng = () => {
  return (
    <img className="w-10 h-10" src="https://img.icons8.com/?size=100&id=12873&format=png&color=000000" alt="coffee" />
  )
}

const DrinkPanel: FC<{ className?: string; id: string | number }> = ({ className, id }) => {
  return (
    <Stack
      direction={'row'}
      center
      className="shadow-lg p-4"
      style={{
        width: 356,
      }}>
      <CupPng />
      <Stack direction={'column'} className="ml-2">
        <Text className="select-none">Time to drink water!</Text>
        <Text className="select-none -mt-1" level="s" gray>
          From Nick at 13:45
        </Text>
      </Stack>
      <Space />
      <TooltipButton
        tooltip="Drink!"
        variant="ghost"
        size={'icon'}
        className={cn('rounded-full text-green-700', className)}
        onClick={() => toast.dismiss(id)}>
        <Check size={32} strokeWidth={4} />
      </TooltipButton>
      <Button
        variant="ghost"
        size={'icon'}
        className={cn('rounded-full text-red-700', className)}
        onClick={() => toast.dismiss(id)}>
        <X size={32} strokeWidth={4} />
      </Button>
    </Stack>
  )
}

const ActionPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <SidebarButton IconClass={Send} label="Small signal">
      <Stack direction={'column'} className="bg-background w-full h-full p-6 rounded-lg shadow-lg">
        <Button
          size={'icon'}
          variant={'ghost'}
          className={cn('rounded-full', className)}
          onClick={() => {
            toast.custom(
              id => {
                return <DrinkPanel id={id} />
              },
              {
                duration: Infinity,
                position: 'top-center',
                dismissible: false,
                style: {
                  borderRadius: '0.75rem',
                },
              },
            )
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'https://img.icons8.com/?size=100&id=12873&format=png&color=000000',
              title: 'Time to drink water!',
              message: 'Stay hydrated for better health.',
            })
          }}>
          <Send />
        </Button>
      </Stack>
    </SidebarButton>
  )
}

export const SettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <TooltipProvider>
      <Stack direction={'column'} className={className}>
        <DrawerSettingPanel />
        <ActionPanel />
      </Stack>
    </TooltipProvider>
  )
}

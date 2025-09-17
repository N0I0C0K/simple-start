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
  tabs,
  Separator,
} from '@extension/ui'
import { Dialog, DialogTrigger, DialogContent } from '@extension/ui/lib/components/ui/dialog'
import type { LucideProps } from 'lucide-react'
import { AlignJustify, SunMoon, History, HardDriveUpload, FileImage, Pointer } from 'lucide-react'
import type { ElementType, FC, ReactElement } from 'react'

type SettingItemProps = {
  title: string
  description: string
  icon: ElementType<LucideProps>
}

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

const SettingContent: FC<{
  className?: string
}> = ({ className }) => {
  return (
    <tabs.Tabs
      orientation="vertical"
      defaultValue="setting"
      className={cn('w-full h-full flex gap-2 border border-slate-400/40 shadow-lg', className)}>
      <tabs.TabsList className="flex-col gap-2 h-full">
        <tabs.TabsTrigger value="setting" className="w-full data-[state=active]:bg-muted">
          Setting
        </tabs.TabsTrigger>
        <tabs.TabsTrigger value="other" className="w-full data-[state=active]:bg-slate-400/40">
          Other
        </tabs.TabsTrigger>
      </tabs.TabsList>
      <span>
        <Separator orientation="vertical" />
      </span>
      <tabs.TabsContent value="setting" className="flex-1">
        <CommonSettings />
      </tabs.TabsContent>
    </tabs.Tabs>
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
        {/* <DrawerOverlay className="fixed inset-0 z-10 bg-black/40" /> */}
        <DrawerContent
          className="right-2 top-2 fixed z-20 outline-none w-[35rem] flex"
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}>
          <div className="bg-background w-full h-full p-6 rounded-lg shadow-lg">
            <CommonSettings />
          </div>
          {/* <DrawerClose asChild>
            <Button size={'icon'} variant={'ghost'} className="absolute top-2 right-2 rounded-full">
              <X />
            </Button>
          </DrawerClose> */}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}

const DialogSettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={'icon'} variant={'ghost'} className={cn('rounded-full', className)}>
          <AlignJustify />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <SettingContent />
      </DialogContent>
    </Dialog>
  )
}

export const SettingPanel: FC<{ className?: string }> = ({ className }) => {
  return <DrawerSettingPanel className={className} />
}

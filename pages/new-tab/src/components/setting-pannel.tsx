import { cn } from '@/lib/utils'
import { closeMqttClientMessage, openMqttClientMessage, useStorage } from '@extension/shared'
import { useDrinkWaterEventManager } from '@extension/shared/lib/state/events'
import { mqttStateManager, settingStorage, exportAllData, importAllData } from '@extension/storage'
import {
  Button,
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
  TooltipButton,
  Separator,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  Badge,
  ScrollArea,
} from '@extension/ui'
import type { LucideProps } from 'lucide-react'
import {
  AlignJustify,
  SunMoon,
  History,
  HardDriveUpload,
  Pointer,
  CupSoda,
  Link2,
  KeyRound,
  ToggleRight,
  User,
  Activity,
  Dot,
  Download,
  Upload,
} from 'lucide-react'
import React, { type ElementType, type FC, type ReactElement, type ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@extension/ui/lib/components/ui/tabs'
import { t } from '@extension/i18n'
import { WallpaperSettings } from './settings/WallpaperSettings'
import { CommandSettings } from './settings/CommandSettings'
import { ReminderSettings } from './settings/ReminderSettings'

const SettingItem: FC<{
  className?: string
  title: string
  description?: string
  control: ReactElement
  IconClass: ElementType<LucideProps>
  additionalControl?: ReactElement
}> = ({ control, title, className, description, IconClass, additionalControl }) => {
  return (
    <Stack
      direction={'row'}
      className={cn(
        'items-center overflow-hidden relative rounded-md p-3 border-slate-400/20',
        'bg-muted gap-2',
        className,
      )}>
      <IconClass className="min-w-8 size-8 text-muted-foreground" />
      <Stack direction={'column'} className="gap-0.5">
        <Text className="font-medium" level="md">
          {title}
        </Text>
        <Text gray className="-mt-1 max-w-[20em]" level="s">
          {description}
        </Text>
      </Stack>
      <Space className="mx-1" />
      <div className="max-w-[50%]">{control}</div>
      {additionalControl}
    </Stack>
  )
}

const ConnectSettingItem: FC = () => {
  const mqttServerState = useStorage(mqttStateManager)
  return (
    <SettingItem
      IconClass={Activity}
      title={t('refreshConnection')}
      description={t('refreshConnectionDescription')}
      control={
        <Button
          variant={'link'}
          onClick={async () => {
            if (mqttServerState.connected) {
              await closeMqttClientMessage.emit()
              return
            }
            await openMqttClientMessage.emit()
          }}>
          {mqttServerState.connected ? t('disconnect') : t('connect')}
        </Button>
      }
      additionalControl={
        <>
          <Stack direction={'row'} center className="absolute bottom-0 end-1">
            <Dot className={mqttServerState.connected ? 'text-green-500' : 'text-red-500'} />
            <Text gray level="xs" className="-ml-2">
              {mqttServerState.connected ? t('connected') : t('disconnected')}
            </Text>
          </Stack>
        </>
      }
    />
  )
}

const MqttSettings: FC = () => {
  const settings = useStorage(settingStorage)
  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      <Stack direction={'column'}>
        <Text gray level="s">
          {t('configureMqttSettings')}
        </Text>
      </Stack>
      <SettingItem
        IconClass={ToggleRight}
        title={t('enable')}
        description={t('enableMqttDescription')}
        control={
          <Switch
            checked={settings.mqttSettings?.enabled}
            onCheckedChange={async val => {
              await settingStorage.update({ mqttSettings: { enabled: val } })
            }}
          />
        }
      />
      <ConnectSettingItem />
      <SettingItem
        IconClass={KeyRound}
        title={t('secretKey')}
        description={t('secretKeyDescription')}
        control={
          <Input
            placeholder={t('enterSecretKey')}
            value={settings.mqttSettings?.secretKey || ''}
            onChange={e => settingStorage.update({ mqttSettings: { secretKey: e.target.value } })}
          />
        }
      />
      <SettingItem
        IconClass={User}
        title={t('username')}
        description={t('usernameDescription')}
        control={
          <Input
            placeholder={t('enterUsername')}
            value={settings.mqttSettings?.username || ''}
            onChange={e => settingStorage.update({ mqttSettings: { username: e.target.value } })}
          />
        }
      />
    </Stack>
  )
}

const CommonSettings: FC = () => {
  const settings = useStorage(settingStorage)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      await exportAllData()
    } catch (error) {
      console.error('Failed to export settings:', error)
      alert('Failed to export settings. Please try again.')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await importAllData(file)
      alert('Settings imported successfully!')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to import settings:', error)
      alert('Failed to import settings: ' + (error as Error).message)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      <Text gray level="s">
        {t('configureGeneralSettings')}
      </Text>
      <SettingItem
        IconClass={SunMoon}
        title={t('theme')}
        description={t('themeDescription')}
        control={<ThemeToggle />}
      />
      <SettingItem
        IconClass={History}
        title={t('historySuggestion')}
        description={t('historySuggestionDescription')}
        control={
          <Switch
            checked={settings.useHistorySuggestion}
            onCheckedChange={val => settingStorage.update({ useHistorySuggestion: val })}
          />
        }
      />
      <SettingItem
        IconClass={Pointer}
        title={t('autoFocusCommandInput')}
        description={t('autoFocusCommandInputDescription')}
        control={
          <Switch
            checked={settings.autoFocusCommandInput}
            onCheckedChange={val => settingStorage.update({ autoFocusCommandInput: val })}
          />
        }
      />
      <SettingItem
        IconClass={HardDriveUpload}
        title={t('wallpaperUrl')}
        description={t('wallpaperUrlDescription')}
        control={
          <Input
            placeholder={t('enterWallpaperUrl')}
            value={settings.wallpaperUrl || ''}
            onChange={e => settingStorage.update({ wallpaperUrl: e.target.value })}
          />
        }
      />
      <Separator className="my-2" />
      <SettingItem
        IconClass={Download}
        title={t('exportSettings')}
        description={t('exportSettingsDescription')}
        control={
          <Button variant={'outline'} onClick={handleExport}>
            {t('export')}
          </Button>
        }
      />
      <SettingItem
        IconClass={Upload}
        title={t('importSettings')}
        description={t('importSettingsDescription')}
        control={
          <>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <Button variant={'outline'} onClick={() => fileInputRef.current?.click()}>
              {t('import')}
            </Button>
          </>
        }
      />
    </Stack>
  )
}

const SettingTabs: FC = () => {
  return (
    <Tabs defaultValue="common-settings">
      <TabsList>
        <TabsTrigger value="common-settings">{t('commonTab')}</TabsTrigger>
        <TabsTrigger value="wallpaper-settings">{t('wallpaperTab')}</TabsTrigger>
        <TabsTrigger value="command-settings">{t('commandTab')}</TabsTrigger>
        <TabsTrigger value="reminders-settings">{t('remindersTab')}</TabsTrigger>
        <TabsTrigger value="mqtt-settings">{t('serverTab')}</TabsTrigger>
      </TabsList>
      <TabsContent value="common-settings">
        <CommonSettings />
      </TabsContent>
      <TabsContent value="wallpaper-settings">
        <WallpaperSettings />
      </TabsContent>
      <TabsContent value="command-settings">
        <CommandSettings />
      </TabsContent>
      <TabsContent value="reminders-settings">
        <ReminderSettings />
      </TabsContent>
      <TabsContent value="mqtt-settings">
        <MqttSettings />
      </TabsContent>
    </Tabs>
  )
}

const SidebarButton: FC<{
  className?: string
  IconClass: ElementType<LucideProps>
  children: ReactNode
  label: string
  description?: string
}> = ({ className, IconClass, children, label, description }) => {
  return (
    <Tooltip>
      <Dialog>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button size={'icon'} variant={'ghost'} className={cn('rounded-full')}>
              <IconClass />
            </Button>
          </TooltipTrigger>
        </DialogTrigger>
        <DialogContent className={cn('', className)}>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-3">{children}</ScrollArea>
        </DialogContent>
        <TooltipContent side="left">
          <Text>{label}</Text>
        </TooltipContent>
      </Dialog>
    </Tooltip>
  )
}

const DrawerSettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <SidebarButton IconClass={AlignJustify} label={t('settings')} description={t('setYourPreferences')}>
      <SettingTabs />
    </SidebarButton>
  )
}

const DrinkWaterButton: FC<{ className?: string }> = ({ className }) => {
  const drinkWaterState = useDrinkWaterEventManager()
  return (
    <TooltipButton
      size={'icon'}
      tooltip={t('drinkWater')}
      variant={'ghost'}
      className={cn('rounded-full', className)}
      side="left"
      onClick={async () => {
        await drinkWaterState.launchEvent()
      }}>
      <CupSoda />
    </TooltipButton>
  )
}

export const SettingPanel: FC<{ className?: string }> = ({ className }) => {
  return (
    <TooltipProvider>
      <Stack direction={'column'} className={cn('gap-2', className)}>
        <DrawerSettingPanel />
        <Separator className="bg-gray-600/40" />
        <DrinkWaterButton />
      </Stack>
    </TooltipProvider>
  )
}

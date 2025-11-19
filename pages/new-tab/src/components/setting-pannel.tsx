import { cn } from '@/lib/utils'
import {
  closeMqttClientMessage,
  receiveDrinkWaterLaunchMessage,
  openMqttClientMessage,
  useStorage,
} from '@extension/shared'
import { useDrinkWaterEventManager } from '@extension/shared/lib/state/events'
import { mqttStateManager, settingStorage } from '@extension/storage'
import deepmerge from 'deepmerge'
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
  Send,
  SunMoon,
  History,
  HardDriveUpload,
  Pointer,
  CupSoda,
  Link2,
  KeyRound,
  ToggleRight,
  User,
  RefreshCcw,
  Activity,
  Dot,
  Download,
  Upload,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import React, { type ElementType, type FC, type ReactElement, type ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@extension/ui/lib/components/ui/tabs'

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
      <Space className="mx-1" />
      <div className="max-w-[50%]">{control}</div>
      {additionalControl}
    </Stack>
  )
}

const ConnectedBadge: FC = () => {
  return (
    <Badge className="bg-green-500">
      <Link2 />
      Connected
    </Badge>
  )
}

const DisconnectedBadge: FC = () => {
  return (
    <Badge className="bg-red-500">
      <Link2 />
      Disconnected
    </Badge>
  )
}

const ConnectSettingItem: FC = () => {
  const mqttServerState = useStorage(mqttStateManager)
  return (
    <SettingItem
      IconClass={Activity}
      title="Refresh Connection"
      description="Reconnect to MQTT server."
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
          {mqttServerState.connected ? 'Disconnect' : 'Connect'}
        </Button>
      }
      additionalControl={
        <>
          <Stack direction={'row'} center className="absolute bottom-0 end-1">
            <Dot className={mqttServerState.connected ? 'text-green-500' : 'text-red-500'} />
            <Text gray level="xs" className="-ml-2">
              {mqttServerState.connected ? 'Connected' : 'Disconnected'}
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
          Configure your MQTT server settings to enable small signal functionality.
        </Text>
      </Stack>
      <SettingItem
        IconClass={ToggleRight}
        title="Enable"
        description="Enable or disable MQTT small signal functionality."
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
        title="Secret Key"
        description="Use the same secret key under same group."
        control={
          <Input
            placeholder="Enter secret key"
            value={settings.mqttSettings?.secretKey || ''}
            onChange={e => settingStorage.update({ mqttSettings: { secretKey: e.target.value } })}
          />
        }
      />
      <SettingItem
        IconClass={User}
        title="Username"
        description="Nick name for small signal."
        control={
          <Input
            placeholder="Enter username"
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
      await settingStorage.exportData()
    } catch (error) {
      console.error('Failed to export settings:', error)
      alert('Failed to export settings. Please try again.')
    }
  }
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      await settingStorage.importData(file)
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
        Configure your general settings.
      </Text>
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
      <Separator className="my-2" />
      <Stack direction={'row'} className={'gap-2 w-full'}>
        <SettingItem
          IconClass={Download}
          title="Export Settings"
          description="Export all settings and quick URLs as JSON."
          control={
            <Button variant={'outline'} onClick={handleExport}>
              Export
            </Button>
          }
        />
        <SettingItem
          IconClass={Upload}
          title="Import Settings"
          description="Import settings and quick URLs from JSON file."
          control={
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <Button variant={'outline'} onClick={() => fileInputRef.current?.click()}>
                Import
              </Button>
            </>
          }
        />
      </Stack>
    </Stack>
  )
}

const SettingTabs: FC = () => {
  return (
    <Tabs defaultValue="common-settings">
      <TabsList>
        <TabsTrigger value="common-settings">Common</TabsTrigger>
        <TabsTrigger value="mqtt-settings">Server</TabsTrigger>
      </TabsList>
      <TabsContent value="common-settings">
        <CommonSettings />
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
          {children}
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
    <SidebarButton IconClass={AlignJustify} label="Settings" description="Set your preferences">
      <SettingTabs />
    </SidebarButton>
  )
}

const DrinkWaterButton: FC<{ className?: string }> = ({ className }) => {
  const drinkWaterState = useDrinkWaterEventManager()
  return (
    <TooltipButton
      size={'icon'}
      tooltip="Drink Water"
      variant={'ghost'}
      className={cn('rounded-full', className)}
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

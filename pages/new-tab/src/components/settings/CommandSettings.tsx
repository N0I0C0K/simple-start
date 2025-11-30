import { useStorage } from '@extension/shared'
import { commandSettingsStorage, defaultCommandSettings } from '@extension/storage'
import type { CommandPluginSettings } from '@extension/storage'
import {
  Stack,
  Text,
  Switch,
  Input,
  Separator,
  Space,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@extension/ui'
import type { LucideProps } from 'lucide-react'
import { History, Layers, Globe, Calculator } from 'lucide-react'
import { type ElementType, type FC } from 'react'
import { t } from '@extension/i18n'

interface CommandPluginConfig {
  name: string
  labelKey: string
  descriptionKey: string
  IconClass: ElementType<LucideProps>
}

const COMMAND_PLUGINS: CommandPluginConfig[] = [
  {
    name: 'history',
    labelKey: 'commandPluginHistory',
    descriptionKey: 'commandPluginHistoryDescription',
    IconClass: History,
  },
  {
    name: 'tabs',
    labelKey: 'commandPluginTabs',
    descriptionKey: 'commandPluginTabsDescription',
    IconClass: Layers,
  },
  {
    name: 'webSearch',
    labelKey: 'commandPluginWebSearch',
    descriptionKey: 'commandPluginWebSearchDescription',
    IconClass: Globe,
  },
  {
    name: 'calculator',
    labelKey: 'commandPluginCalculator',
    descriptionKey: 'commandPluginCalculatorDescription',
    IconClass: Calculator,
  },
]

const CommandPluginSettingItem: FC<{
  config: CommandPluginConfig
  settings: CommandPluginSettings
  onUpdate: (settings: Partial<CommandPluginSettings>) => void
}> = ({ config, settings, onUpdate }) => {
  return (
    <AccordionItem value={config.name} className="rounded-md bg-muted px-3">
      <AccordionTrigger className="hover:no-underline py-3">
        <Stack direction={'column'} className="gap-1 flex-1 items-start">
          <Stack direction={'row'} center className="gap-2 w-full">
            <config.IconClass className="size-5 text-muted-foreground" />
            <Text className="font-medium" level="md">
              {t(config.labelKey as never)}
            </Text>
            <Space className="flex-1" />
            <Stack
              direction={'row'}
              center
              className="gap-2"
              onClick={e => e.stopPropagation()}>
              <Text level="s" gray>
                {t('commandPluginActive')}
              </Text>
              <Switch checked={settings.active} onCheckedChange={val => onUpdate({ active: val })} />
            </Stack>
          </Stack>
          <Text gray level="xs" className="text-left">
            {t(config.descriptionKey as never)}
          </Text>
        </Stack>
      </AccordionTrigger>
      <AccordionContent className="pb-3">
        <Stack direction={'column'} className="gap-3">
          <Separator />
          <Stack direction={'row'} center className="gap-2">
            <Text level="s">{t('commandPluginIncludeInGlobal')}</Text>
            <Space className="flex-1" />
            <Switch checked={settings.includeInGlobal} onCheckedChange={val => onUpdate({ includeInGlobal: val })} />
          </Stack>
          <Stack direction={'row'} center className="gap-2">
            <Text level="s" className="whitespace-nowrap">
              {t('commandPluginActiveKey')}
            </Text>
            <Space className="flex-1" />
            <Input
              placeholder={t('commandPluginActiveKeyPlaceholder')}
              value={settings.activeKey}
              onChange={e => onUpdate({ activeKey: e.target.value })}
              className="w-24"
            />
          </Stack>
          <Stack direction={'row'} center className="gap-2">
            <Text level="s" className="whitespace-nowrap">
              {t('commandPluginPriority')}
            </Text>
            <Space className="flex-1" />
            <Input
              type="number"
              value={settings.priority}
              onChange={e => {
                const parsed = parseInt(e.target.value, 10)
                if (!isNaN(parsed)) {
                  onUpdate({ priority: parsed })
                }
              }}
              className="w-24"
            />
          </Stack>
        </Stack>
      </AccordionContent>
    </AccordionItem>
  )
}

export const CommandSettings: FC = () => {
  const commandSettings = useStorage(commandSettingsStorage)

  const handlePluginUpdate = (pluginName: string, updates: Partial<CommandPluginSettings>) => {
    void commandSettingsStorage.setPluginSettings(pluginName, updates)
  }

  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      <Text gray level="s">
        {t('configureCommandSettings')}
      </Text>
      <Accordion type="multiple" className="flex flex-col gap-2">
        {COMMAND_PLUGINS.map(config => {
          const pluginSettings = commandSettings[config.name] || defaultCommandSettings[config.name]
          return (
            <CommandPluginSettingItem
              key={config.name}
              config={config}
              settings={pluginSettings}
              onUpdate={updates => handlePluginUpdate(config.name, updates)}
            />
          )
        })}
      </Accordion>
    </Stack>
  )
}

import { cn } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { reminderItemsStorage, type ReminderItem } from '@extension/storage'
import {
  Button,
  Stack,
  Text,
  Switch,
  Input,
  Separator,
  Badge,
} from '@extension/ui'
import { Bell, Plus, Trash2, Clock } from 'lucide-react'
import React, { useState, type FC } from 'react'
import { t } from '@extension/i18n'
import { nanoid } from 'nanoid'

const ReminderItemCard: FC<{
  reminder: ReminderItem
  onEdit: (reminder: ReminderItem) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}> = ({ reminder, onEdit, onDelete, onToggle }) => {
  return (
    <Stack
      direction={'row'}
      className={cn(
        'items-center overflow-hidden relative rounded-md p-3 border',
        'bg-muted gap-2',
        reminder.enabled ? 'border-primary/30' : 'border-slate-400/20',
      )}>
      <div className="text-2xl min-w-8">{reminder.icon || '🔔'}</div>
      <Stack direction={'column'} className="gap-0.5 flex-1">
        <Stack direction={'row'} className="items-center gap-2">
          <Text className="font-medium" level="md">
            {reminder.name}
          </Text>
          <Badge variant={reminder.enabled ? 'default' : 'secondary'} className="text-xs">
            {reminder.enabled ? t('reminderEnabled') : t('reminderDisabled')}
          </Badge>
        </Stack>
        <Text gray className="-mt-1" level="s">
          {t('reminderEvery')} {reminder.intervalMinutes} {t('reminderMinutes')}
        </Text>
        <Text gray className="text-xs" level="xs">
          {t('reminderCreatedAt')}: {new Date(reminder.createdAt).toLocaleString()}
        </Text>
      </Stack>
      <Switch checked={reminder.enabled} onCheckedChange={enabled => onToggle(reminder.id, enabled)} />
      <Button size={'sm'} variant={'ghost'} onClick={() => onEdit(reminder)}>
        {t('editReminder')}
      </Button>
      <Button size={'sm'} variant={'ghost'} onClick={() => onDelete(reminder.id)}>
        <Trash2 className="size-4 text-red-500" />
      </Button>
    </Stack>
  )
}

const ReminderForm: FC<{
  reminder?: ReminderItem
  onSave: (reminder: Omit<ReminderItem, 'id' | 'createdAt'>) => void
  onCancel: () => void
}> = ({ reminder, onSave, onCancel }) => {
  const [name, setName] = useState(reminder?.name || '')
  const [icon, setIcon] = useState(reminder?.icon || '💧')
  const [intervalMinutes, setIntervalMinutes] = useState(reminder?.intervalMinutes?.toString() || '30')
  const [startNow, setStartNow] = useState(!reminder)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const interval = parseInt(intervalMinutes, 10)
    if (!name || !interval || interval < 1) {
      alert('Please fill in all fields with valid values.')
      return
    }

    onSave({
      name,
      icon,
      enabled: reminder?.enabled ?? true,
      intervalMinutes: interval,
      startTime: startNow ? new Date().toISOString() : reminder?.startTime || new Date().toISOString(),
      lastTriggeredAt: reminder?.lastTriggeredAt,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction={'column'} className="gap-4">
        <Stack direction={'column'} className="gap-2">
          <Text level="sm" className="font-medium">
            {t('reminderName')}
          </Text>
          <Input
            placeholder={t('reminderNamePlaceholder')}
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </Stack>

        <Stack direction={'column'} className="gap-2">
          <Text level="sm" className="font-medium">
            {t('reminderIcon')}
          </Text>
          <Input
            placeholder={t('reminderIconPlaceholder')}
            value={icon}
            onChange={e => setIcon(e.target.value)}
            maxLength={10}
          />
        </Stack>

        <Stack direction={'column'} className="gap-2">
          <Text level="sm" className="font-medium">
            {t('reminderInterval')}
          </Text>
          <Input
            type="number"
            placeholder={t('reminderIntervalPlaceholder')}
            value={intervalMinutes}
            onChange={e => setIntervalMinutes(e.target.value)}
            min={1}
            required
          />
        </Stack>

        {!reminder && (
          <Stack direction={'row'} className="items-center gap-2">
            <Switch checked={startNow} onCheckedChange={setStartNow} />
            <Text level="sm">{t('startNow')}</Text>
          </Stack>
        )}

        <Stack direction={'row'} className="gap-2 justify-end">
          <Button type="button" variant={'outline'} onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit">{t('saveReminder')}</Button>
        </Stack>
      </Stack>
    </form>
  )
}

export const ReminderSettings: FC = () => {
  const reminders = useStorage(reminderItemsStorage)
  const [isAdding, setIsAdding] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null)

  const handleSaveReminder = async (reminderData: Omit<ReminderItem, 'id' | 'createdAt'>) => {
    if (editingReminder) {
      // Update existing reminder
      await reminderItemsStorage.putById(editingReminder.id, {
        ...reminderData,
        id: editingReminder.id,
        createdAt: editingReminder.createdAt,
      })
      setEditingReminder(null)
    } else {
      // Add new reminder
      const newReminder: ReminderItem = {
        ...reminderData,
        id: nanoid(),
        createdAt: new Date().toISOString(),
      }
      await reminderItemsStorage.add(newReminder)
      setIsAdding(false)
    }
  }

  const handleDeleteReminder = async (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      await reminderItemsStorage.removeById(id)
    }
  }

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    const reminder = reminders.find(r => r.id === id)
    if (reminder) {
      await reminderItemsStorage.putById(id, { ...reminder, enabled })
    }
  }

  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      <Stack direction={'row'} className="items-center justify-between">
        <Text gray level="s">
          {t('configureReminders')}
        </Text>
        {!isAdding && !editingReminder && (
          <Button size={'sm'} onClick={() => setIsAdding(true)}>
            <Plus className="size-4 mr-1" />
            {t('addReminder')}
          </Button>
        )}
      </Stack>

      {(isAdding || editingReminder) && (
        <>
          <Separator className="my-2" />
          <ReminderForm
            reminder={editingReminder || undefined}
            onSave={handleSaveReminder}
            onCancel={() => {
              setIsAdding(false)
              setEditingReminder(null)
            }}
          />
          <Separator className="my-2" />
        </>
      )}

      {reminders.length === 0 && !isAdding ? (
        <Stack direction={'column'} className="items-center justify-center py-8 text-center">
          <Bell className="size-12 text-muted-foreground mb-2" />
          <Text gray level="sm">
            {t('noReminders')}
          </Text>
        </Stack>
      ) : (
        <Stack direction={'column'} className="gap-2 mt-2">
          {reminders.map(reminder => (
            <ReminderItemCard
              key={reminder.id}
              reminder={reminder}
              onEdit={setEditingReminder}
              onDelete={handleDeleteReminder}
              onToggle={handleToggleReminder}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

import { reminderItemsStorage } from '@extension/storage'
import type { ReminderItem } from '@extension/storage'

const ALARM_PREFIX = 'reminder_'

// Initialize alarms for all enabled reminders
export async function initializeReminders() {
  const reminders = await reminderItemsStorage.get()
  const enabledReminders = reminders.filter(r => r.enabled)

  console.log('Initializing reminders:', enabledReminders.length)

  // Clear existing alarms
  const existingAlarms = await chrome.alarms.getAll()
  for (const alarm of existingAlarms) {
    if (alarm.name.startsWith(ALARM_PREFIX)) {
      await chrome.alarms.clear(alarm.name)
    }
  }

  // Create alarms for enabled reminders
  for (const reminder of enabledReminders) {
    await scheduleReminder(reminder)
  }
}

// Schedule an alarm for a specific reminder
export async function scheduleReminder(reminder: ReminderItem) {
  const alarmName = `${ALARM_PREFIX}${reminder.id}`

  if (!reminder.enabled) {
    await chrome.alarms.clear(alarmName)
    return
  }

  const startTime = new Date(reminder.startTime).getTime()
  const now = Date.now()
  const intervalMs = reminder.intervalMinutes * 60 * 1000

  let when: number

  if (reminder.lastTriggeredAt) {
    // Schedule next alarm based on last triggered time
    const lastTriggered = new Date(reminder.lastTriggeredAt).getTime()
    when = lastTriggered + intervalMs
  } else if (startTime > now) {
    // First alarm hasn't triggered yet, use start time
    when = startTime
  } else {
    // Start time is in the past, calculate next occurrence
    const elapsed = now - startTime
    const periods = Math.floor(elapsed / intervalMs)
    when = startTime + (periods + 1) * intervalMs
  }

  console.log(`Scheduling reminder "${reminder.name}" (${reminder.id}) at ${new Date(when).toLocaleString()}`)

  await chrome.alarms.create(alarmName, {
    when,
    periodInMinutes: reminder.intervalMinutes,
  })
}

// Cancel alarm for a specific reminder
export async function cancelReminder(reminderId: string) {
  const alarmName = `${ALARM_PREFIX}${reminderId}`
  await chrome.alarms.clear(alarmName)
}

// Handle alarm trigger
export async function handleReminderAlarm(alarmName: string) {
  if (!alarmName.startsWith(ALARM_PREFIX)) {
    return
  }

  const reminderId = alarmName.substring(ALARM_PREFIX.length)
  const reminders = await reminderItemsStorage.get()
  const reminder = reminders.find(r => r.id === reminderId)

  if (!reminder || !reminder.enabled) {
    await chrome.alarms.clear(alarmName)
    return
  }

  console.log('Reminder alarm triggered:', reminder.name)

  // Update last triggered time immediately when alarm fires
  await reminderItemsStorage.putById(reminderId, {
    ...reminder,
    lastTriggeredAt: new Date().toISOString(),
  })

  // Send message to frontend for toast notification
  await chrome.runtime.sendMessage({
    name: 'reminder-notification',
    payload: {
      id: reminder.id,
      name: reminder.name,
      icon: reminder.icon,
    },
  })

  // Show notification
  await showReminderNotification(reminder)
}

// Show chrome notification
async function showReminderNotification(reminder: ReminderItem) {
  const notificationId = `reminder_notification_${reminder.id}_${Date.now()}`

  await chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon-128.png'),
    title: reminder.icon ? `${reminder.icon} Reminder` : 'Reminder',
    message: reminder.name,
    buttons: [{ title: 'Complete' }, { title: 'Skip' }],
    requireInteraction: true,
    priority: 2,
  })

  // Store reminder ID with notification ID for later reference
  await chrome.storage.local.set({
    [`notification_${notificationId}`]: reminder.id,
  })
}

// Handle notification button click
export async function handleNotificationButtonClick(notificationId: string, buttonIndex: number) {
  if (!notificationId.startsWith('reminder_notification_')) {
    return
  }

  const storageKey = `notification_${notificationId}`
  const result = await chrome.storage.local.get(storageKey)
  const reminderId = result[storageKey]

  if (!reminderId) {
    return
  }

  // Clean up storage
  await chrome.storage.local.remove(storageKey)

  const reminders = await reminderItemsStorage.get()
  const reminder = reminders.find(r => r.id === reminderId)

  if (!reminder) {
    return
  }

  if (buttonIndex === 0) {
    // Complete button clicked
    console.log('Reminder completed:', reminder.name)
  } else if (buttonIndex === 1) {
    // Skip button clicked
    console.log('Reminder skipped:', reminder.name)
  }

  // Close the notification
  await chrome.notifications.clear(notificationId)
}

// Handle notification closed
export async function handleNotificationClosed(notificationId: string) {
  if (notificationId.startsWith('reminder_notification_')) {
    const storageKey = `notification_${notificationId}`
    await chrome.storage.local.remove(storageKey)
  }
}

// Listen for storage changes to update alarms
export function setupReminderStorageListener() {
  reminderItemsStorage.subscribe(async () => {
    const reminders = await reminderItemsStorage.get()
    const enabledReminders = reminders.filter(r => r.enabled)

    // Get current alarms
    const existingAlarms = await chrome.alarms.getAll()
    const existingReminderAlarms = existingAlarms
      .filter(a => a.name.startsWith(ALARM_PREFIX))
      .map(a => a.name.substring(ALARM_PREFIX.length))

    // Schedule new/updated reminders
    for (const reminder of enabledReminders) {
      await scheduleReminder(reminder)
    }

    // Cancel alarms for removed or disabled reminders
    const enabledIds = new Set(enabledReminders.map(r => r.id))
    for (const alarmId of existingReminderAlarms) {
      if (!enabledIds.has(alarmId)) {
        await cancelReminder(alarmId)
      }
    }
  })
}

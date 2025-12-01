import type { EventCenter, Event, events, MqttProvider } from '@extension/shared'
import { generateEventCenter } from '@extension/shared'
import { settingStorage } from '@extension/storage'

export let eventCenter: EventCenter | null = null
export let drinkWaterLaunchEvent: Event<events.DrinkWaterLaunchPayload> | null = null

export async function initializeEventCenter(mqttProvider: MqttProvider) {
  const mqttSettings = await settingStorage.getMqttSettings()
  if (!mqttSettings?.secretKey) {
    throw new Error('MQTT settings not found')
  }
  eventCenter = await generateEventCenter(mqttProvider)
  drinkWaterLaunchEvent = eventCenter.getOrRegisterEvent<events.DrinkWaterLaunchPayload>({
    eventName: 'drink-water-launch',
    topic: `${mqttSettings.secretKey}/drink-water/launch`,
  })
}

export async function registerConfirmEvent(payload: events.DrinkWaterLaunchPayload) {
  if (!eventCenter) return
  const mqttSettings = await settingStorage.getMqttSettings()
  if (!mqttSettings?.secretKey)
    throw new Error('MQTT settings not found')
  const confirmEvent = eventCenter.getOrRegisterEvent<events.DrinkWaterConfirmPayload>({
    eventName: `drink-water-confirm-${payload.id}`,
    topic: `${mqttSettings.secretKey}/drink-water/confirm/${payload.id}`,
  })
  return confirmEvent
}

/**
 * Unregisters a confirm event for a drink water launch payload.
 * This function is intended for cleanup when an event is no longer needed,
 * such as when a drink water event is completed or cancelled.
 */
export async function unregisterConfirmEvent(payload: events.DrinkWaterLaunchPayload) {
  if (!eventCenter) return
  const confirmEvent = eventCenter.getRegisteredEvent<events.DrinkWaterConfirmPayload>(`drink-water-confirm-${payload.id}`)
  if (!confirmEvent) return
  eventCenter.unregisterEvent(confirmEvent)
}

import type { events } from '@extension/shared'
import {
  receiveDrinkWaterConfirmMessage,
  receiveDrinkWaterLaunchMessage,
} from '@extension/shared'
import { settingStorage } from '@extension/storage'
import { registerConfirmEvent, eventCenter } from './event-manager'

export async function onReceiveDrinkWaterConfirm(payload: events.DrinkWaterConfirmPayload) {
  await receiveDrinkWaterConfirmMessage.emit(payload)
}

export async function onReceiveDrinkWaterLaunch(payload: events.DrinkWaterLaunchPayload) {
  if (!eventCenter) return
  const mqttSettings = await settingStorage.getMqttSettings()
  if (!mqttSettings) return

  await receiveDrinkWaterLaunchMessage.emit(payload)

  const confirmEvent = await registerConfirmEvent(payload)
  if (confirmEvent) {
    confirmEvent.registerReceiveCallback(onReceiveDrinkWaterConfirm)
  }
}

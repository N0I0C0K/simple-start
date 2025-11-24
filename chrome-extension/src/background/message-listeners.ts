import {
  sendDrinkWaterConfirmMessage,
  closeMqttClientMessage,
  openMqttClientMessage,
  setLaunchPollingMessage,
} from '@extension/shared'
import { mqttProvider, setupMqtt } from './mqtt-manager'
import { eventCenter, initializeEventCenter, drinkWaterLaunchEvent } from './event-manager'
import { setLaunchPolling } from './polling-manager'
import { onReceiveDrinkWaterLaunch } from './drink-water-handlers'

export function initializeMessageListeners() {
  sendDrinkWaterConfirmMessage.registerListener(async payload => {
    const confirmEventName = `drink-water-confirm-${payload.eventId}`
    if (!eventCenter) return
    const confirmEvent = eventCenter.getRegisteredEvent(confirmEventName)
    if (!confirmEvent) return
    await confirmEvent.emit(payload)
    console.log('Send drink water confirm message:', payload)
  })

  closeMqttClientMessage.registerListener(async () => {
    if (!mqttProvider) return
    await mqttProvider.client.endAsync()
  })

  openMqttClientMessage.registerListener(async () => {
    if (!mqttProvider) {
      const provider = await setupMqtt()
      if (provider) {
        await initializeEventCenter(provider)
        if (drinkWaterLaunchEvent) {
          drinkWaterLaunchEvent.registerReceiveCallback(onReceiveDrinkWaterLaunch)
        }
      }
      return
    }
    if (mqttProvider.client.connected) return
    mqttProvider.client.reconnect()
  })

  setLaunchPollingMessage.registerListener(async payload => {
    await setLaunchPolling(payload)
  })
}

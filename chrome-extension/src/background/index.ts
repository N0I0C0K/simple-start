import 'webextension-polyfill'
// import { nanoid } from 'nanoid'
import { mqttStateManager, mqttStateStorage, settingStorage } from '@extension/storage'
import type { EventCenter, MqttProvider, events, Event } from '@extension/shared'
import {
  generateClient,
  generateEventCenter,
  receiveDrinkWaterConfirmMessage,
  receiveDrinkWaterLaunchMessage,
  closeMqttClientMessage,
  openMqttClientMessage,
  setLaunchPollingMessage,
  drinkWaterEventGlobalState,
  sendDrinkWaterConfirmMessage,
} from '@extension/shared'
import type { MqttClient } from 'mqtt/*'

// exampleThemeStorage.get().then(theme => {
//   console.log('theme', theme)
// })

// console.log('background loaded')
// console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.")

chrome.runtime.onSuspend.addListener(() => {
  console.log('background script is being unloaded')
})

chrome.runtime.onSuspendCanceled.addListener(() => {
  console.log('background script unload was canceled')
})

let mqttProvider: MqttProvider | null = null
let eventCenter: EventCenter | null = null
let drinkWaterLaunchEvent: Event<events.DrinkWaterLaunchPayload> | null = null

async function onReceiveDrinkWaterConfirm(payload: events.DrinkWaterConfirmPayload) {
  await receiveDrinkWaterConfirmMessage.emit(payload)
}

async function initializeMqttState() {
  await mqttStateManager.setConnected(false)
  const mqttSettings = await settingStorage.getMqttSettings()
  if (mqttSettings?.enabled) {
    await setupMqtt()
  } else {
    return
  }
}

async function registerConfirmEvent(payload: events.DrinkWaterLaunchPayload) {
  if (!eventCenter) return
  const mqttSettings = await settingStorage.getMqttSettings()
  if (!mqttSettings)
    throw new Error('MQTT settings not found')
  const confirmEvent = eventCenter.getOrRegisterEvent<events.DrinkWaterConfirmPayload>({
    eventName: `drink-water-confirm-${payload.id}`,
    topic: `${mqttSettings.secretKey}/drink-water/confirm/${payload.id}`,
  })
  confirmEvent.registerReceiveCallback(onReceiveDrinkWaterConfirm)
}

async function unregisterConfirmEvent(payload: events.DrinkWaterLaunchPayload) {
  if (!eventCenter) return
  const confirmEvent = eventCenter.getRegisteredEvent<events.DrinkWaterConfirmPayload>(`drink-water-confirm-${payload.id}`)
  if (!confirmEvent) return
  confirmEvent.unregisterReceiveCallback(onReceiveDrinkWaterConfirm)
  eventCenter.unregisterEvent(confirmEvent)
}

async function onReceiveDrinkWaterLaunch(payload: events.DrinkWaterLaunchPayload) {
  if (!eventCenter) return
  const mqttSettings = await settingStorage.getMqttSettings()
  if (!mqttSettings) return

  await receiveDrinkWaterLaunchMessage.emit(payload)

  await registerConfirmEvent(payload)
}

async function _initMqttClientEvent(client: MqttClient) {
  client.on('close', async () => {
    console.log('MQTT connection closed')
    await mqttStateManager.setConnected(false)
  })
  client.on('connect', async () => {
    console.log('MQTT connected')
    await mqttStateManager.setConnected(true)
  })
}

async function setupMqtt() {
  const settings = await settingStorage.get()
  console.log('Current MQTT settings:', settings.mqttSettings)

  if (!(settings.mqttSettings?.enabled && settings.mqttSettings.secretKey)) {
    console.log('MQTT is disabled or not properly configured.')
    return
  }
  console.log('Connecting to MQTT broker...')
  mqttProvider = await generateClient('ws://broker.emqx.io:8083/mqtt')
  console.log('MQTT connected')
  _initMqttClientEvent(mqttProvider.client)

  await mqttStateManager.setConnected(true)

  eventCenter = await generateEventCenter(mqttProvider)
  drinkWaterLaunchEvent = eventCenter.getOrRegisterEvent<events.DrinkWaterLaunchPayload>({
    eventName: 'drink-water-launch',
    topic: `${settings.mqttSettings.secretKey}/drink-water/launch`,
  })
  drinkWaterLaunchEvent.registerReceiveCallback(onReceiveDrinkWaterLaunch)
}

// receiveDrinkWaterLaunchMessage.registerListener(async payload => {
//   if (!drinkWaterLaunchEvent) return
//   drinkWaterLaunchEvent.emit(payload)
//   await registerConfirmEvent(payload)
// })

sendDrinkWaterConfirmMessage.registerListener(async payload => {
  const confirmEventName = `drink-water-confirm-${payload.eventId}`
  if (!eventCenter) return
  const confirmEvent = eventCenter.getRegisteredEvent<events.DrinkWaterConfirmPayload>(confirmEventName)
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
    await setupMqtt()
    return
  }
  if (mqttProvider.client.connected) return
  mqttProvider.client.reconnect()
})

let _launchPollingHandler: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intervalId: any
  launchPayload: events.DrinkWaterLaunchPayload
} | null = null

setLaunchPollingMessage.registerListener(async payload => {
  if (!drinkWaterLaunchEvent) return
  if (payload === null) {
    if (_launchPollingHandler) {
      clearInterval(_launchPollingHandler.intervalId)
      _launchPollingHandler = null
    }
    return
  }

  if (_launchPollingHandler?.launchPayload.id === payload?.id) {
    return
  }

  const intervalId = setInterval(async () => {
    const state = await drinkWaterEventGlobalState.get()
    if (state.currentEvent?.id !== payload.id) {
      console.log('Stopping launch polling for event:', payload)
      clearInterval(intervalId)
      _launchPollingHandler = null
      return
    }
    drinkWaterLaunchEvent!.emit(payload)
  }, 5 * 1000)

  _launchPollingHandler = {
    intervalId: intervalId,
    launchPayload: payload,
  }
  registerConfirmEvent(payload)
})

initializeMqttState()
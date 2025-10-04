import 'webextension-polyfill'
// import { nanoid } from 'nanoid'
import { settingStorage } from '@extension/storage'
import type { EventCenter, MqttProvider, events, Event } from '@extension/shared'
import {
  generateClient,
  generateEventCenter,
  drinkWaterConfirmMessage,
  drinkWaterLaunchMessage,
} from '@extension/shared'

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
  await drinkWaterConfirmMessage.emit(payload)
}

async function onReceiveDrinkWaterLaunch(payload: events.DrinkWaterLaunchPayload) {
  if (!eventCenter) return
  const mqttSettings = await settingStorage.getMqttSettings()
  if (!mqttSettings) return

  await drinkWaterLaunchMessage.emit(payload)

  const confirmEvent = eventCenter.getOrRegisterEvent<events.DrinkWaterConfirmPayload>({
    eventName: `drink-water-confirm-${payload.id}`,
    topic: payload.topic,
  })
  confirmEvent.registerReceiveCallback(onReceiveDrinkWaterConfirm)
}

async function setupMqtt() {
  const settings = await settingStorage.get()
  console.log('Current MQTT settings:', settings.mqttSettings)

  if (!(settings.mqttSettings?.enabled && settings.mqttSettings.mqttBrokerUrl && settings.mqttSettings.secretKey)) {
    console.log('MQTT is disabled or not properly configured.')
    return
  }
  console.log('Connecting to MQTT broker...')
  mqttProvider = await generateClient('ws://broker.emqx.io:8083/mqtt')
  console.log('MQTT connected')

  eventCenter = await generateEventCenter(mqttProvider)
  drinkWaterLaunchEvent = eventCenter.getOrRegisterEvent<events.DrinkWaterLaunchPayload>({
    eventName: 'drink-water-launch',
    topic: `${settings.mqttSettings.secretKey}/drink-water/launch`,
  })
  drinkWaterLaunchEvent.registerReceiveCallback(onReceiveDrinkWaterLaunch)
}

drinkWaterLaunchMessage.registerListener(async payload => {
  if (!drinkWaterLaunchEvent) return
  const mqttSettings = await settingStorage.getMqttSettings()
  if (!mqttSettings) return
  drinkWaterLaunchEvent.emit(payload)
})
drinkWaterConfirmMessage.registerListener(async payload => {
  const confirmEventName = `drink-water-confirm-${payload.id}`
  if (!eventCenter) return
  const confirmEvent = eventCenter.getRegisteredEvent<events.DrinkWaterConfirmPayload>(confirmEventName)
  if (!confirmEvent) return
  confirmEvent.emit(payload)
})

setupMqtt()

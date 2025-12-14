import 'webextension-polyfill'
// import { nanoid } from 'nanoid'
import { mqttStateManager, settingStorage } from '@extension/storage'
import type { EventCenter, MqttProvider } from '@extension/shared'
import { generateClient, generateEventCenter, closeMqttClientMessage, openMqttClientMessage } from '@extension/shared'
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

async function initializeMqttState() {
  await mqttStateManager.setConnected(false)
  const mqttSettings = await settingStorage.getMqttSettings()
  if (mqttSettings?.enabled) {
    await setupMqtt()
  } else {
    return
  }
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
}

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

initializeMqttState()

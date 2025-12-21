import type { ILoadable } from './type'

import { mqttStateManager, settingStorage } from '@extension/storage'
import {
  MqttPayloadBuilder,
  MqttProvider,
  closeMqttClientMessage,
  openMqttClientMessage,
  sendDrinkWaterReminderMessage,
} from '@extension/shared'
import type { MqttBasePayload } from '@extension/shared'
import type { MqttClient } from 'mqtt'

async function initMqttClientEvent(client: MqttClient) {
  client.on('close', async () => {
    console.log('MQTT connection closed')
    await mqttStateManager.setConnected(false)
  })
  client.on('connect', async () => {
    console.log('MQTT connected')
    await mqttStateManager.setConnected(true)
  })
}

const mqttProvider: MqttProvider = new MqttProvider('ws://broker.emqx.io:8083/mqtt')
const payloadBuilder = new MqttPayloadBuilder()
mqttProvider.on('client-loaded', async client => {
  if (client.connected) {
    await mqttStateManager.setConnected(true)
  }
  initMqttClientEvent(client)
})

async function setupMqtt() {
  await mqttStateManager.setConnected(false)
  const settings = await settingStorage.get()
  console.log('Current MQTT settings:', settings.mqttSettings)

  if (!(settings.mqttSettings?.enabled && settings.mqttSettings.secretKey)) {
    console.log('MQTT is disabled or not properly configured.')
    return
  }
  console.log('Connecting to MQTT broker...')
  mqttProvider.changeSecretPrefix(settings.mqttSettings.secretKey)
  payloadBuilder.username = settings.mqttSettings.username
  await mqttProvider.connect({ brokerUrl: settings.mqttSettings.mqttBrokerUrl })
  console.log('MQTT connected')
}

closeMqttClientMessage.registerListener(async () => {
  await mqttProvider.disconnect()
})

openMqttClientMessage.registerListener(async () => {
  const settings = await settingStorage.get()
  payloadBuilder.username = settings.mqttSettings.username
  await mqttProvider.changeSecretPrefix(settings.mqttSettings.secretKey)
  await mqttProvider.connect()
})

const heartBeatEvent = mqttProvider.getOrCreateTopicEvent<MqttBasePayload>('heart-beat')

// Drink water event handler - defined before usage
const drinkWaterEvent = mqttProvider.getOrCreateTopicEvent<MqttBasePayload>('drink-water')
drinkWaterEvent.subscribe(async payload => {
  console.log('Received drink water reminder from:', payload.senderUserName)
  
  // Validate sender username to prevent malicious content
  const senderUserName = typeof payload.senderUserName === 'string' && payload.senderUserName.trim()
    ? payload.senderUserName.trim().substring(0, 50) // Limit length for safety
    : 'Someone'
  
  // Create Chrome notification with safe ID generation
  const notificationId = `drink-water-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  await chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon-128.png'),
    title: chrome.i18n.getMessage('drinkWaterNotificationTitle'),
    message: chrome.i18n.getMessage('drinkWaterNotificationMessage', [senderUserName]),
    priority: 2,
    requireInteraction: false,
  })
})

sendDrinkWaterReminderMessage.registerListener(async () => {
  console.log('Received request to send drink water reminder')
  
  if (!mqttProvider.connected) {
    console.error('Cannot send drink water reminder: MQTT client is not connected')
    // Notify user of connection failure
    await chrome.notifications.create('drink-water-connection-error', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-128.png'),
      title: chrome.i18n.getMessage('drinkWaterConnectionErrorTitle'),
      message: chrome.i18n.getMessage('drinkWaterConnectionErrorMessage'),
      priority: 1,
    })
    return
  }
  
  const settings = await settingStorage.get()
  if (!settings.mqttSettings?.username) {
    console.error('Cannot send drink water reminder: username not set')
    // Notify user of missing username
    await chrome.notifications.create('drink-water-config-error', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-128.png'),
      title: chrome.i18n.getMessage('drinkWaterConfigErrorTitle'),
      message: chrome.i18n.getMessage('drinkWaterConfigErrorMessage'),
      priority: 1,
    })
    return
  }
  
  // Use local payload to avoid race conditions with shared payloadBuilder
  const localPayloadBuilder = new MqttPayloadBuilder(settings.mqttSettings.username)
  await drinkWaterEvent.emit(localPayloadBuilder.buildPayload({}))
  console.log('Drink water reminder sent successfully')
})

chrome.alarms.create('mqtt-heart-beat', { periodInMinutes: 0.5 })
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'mqtt-heart-beat') {
    if (!mqttProvider.connected) {
      return
    }
    await heartBeatEvent.emit(payloadBuilder.buildPayload({}))
  }
})

export const MqttLoader: ILoadable = {
  async load() {
    await setupMqtt()
  },
}

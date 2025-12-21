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

sendDrinkWaterReminderMessage.registerListener(async () => {
  console.log('Received request to send drink water reminder')
  if (!mqttProvider.connected) {
    console.error('Cannot send drink water reminder: MQTT client is not connected')
    return
  }
  
  const settings = await settingStorage.get()
  if (!settings.mqttSettings?.username) {
    console.error('Cannot send drink water reminder: username not set')
    return
  }
  
  payloadBuilder.username = settings.mqttSettings.username
  await drinkWaterEvent.emit(payloadBuilder.buildPayload({}))
  console.log('Drink water reminder sent successfully')
})

const heartBeatEvent = mqttProvider.getOrCreateTopicEvent<MqttBasePayload>('heart-beat')

// Drink water event handler
const drinkWaterEvent = mqttProvider.getOrCreateTopicEvent<MqttBasePayload>('drink-water')
drinkWaterEvent.subscribe(async payload => {
  console.log('Received drink water reminder from:', payload.senderUserName)
  
  // Create Chrome notification
  await chrome.notifications.create(`drink-water-${payload.timestamp}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon-128.png'),
    title: chrome.i18n.getMessage('drinkWaterNotificationTitle'),
    message: chrome.i18n.getMessage('drinkWaterNotificationMessage', [payload.senderUserName]),
    priority: 2,
    requireInteraction: false,
  })
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

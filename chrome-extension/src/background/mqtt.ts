import type { ILoadable } from "./type";

import { mqttStateManager, settingStorage } from '@extension/storage'
import { MqttPayloadBuilder, MqttProvider, closeMqttClientMessage, openMqttClientMessage } from '@extension/shared'
import type { MqttBasePayload } from '@extension/shared'
import type { MqttClient } from 'mqtt'

const mqttProvider: MqttProvider = new MqttProvider('ws://broker.emqx.io:8083/mqtt')
const payloadBuilder = new MqttPayloadBuilder()

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
  await mqttStateManager.setConnected(false)
  const settings = await settingStorage.get()
  console.log('Current MQTT settings:', settings.mqttSettings)

  if (!(settings.mqttSettings?.enabled && settings.mqttSettings.secretKey)) {
    console.log('MQTT is disabled or not properly configured.')
    return
  }
  console.log('Connecting to MQTT broker...')
  await mqttProvider.changeSecretPrefix(settings.mqttSettings.secretKey)
  await mqttProvider.connect({ brokerUrl: settings.mqttSettings.mqttBrokerUrl })
  payloadBuilder.username = settings.mqttSettings.username
  console.log('MQTT connected')
  _initMqttClientEvent(mqttProvider.client)

  await mqttStateManager.setConnected(true)
}

closeMqttClientMessage.registerListener(async () => {
  await mqttProvider.disconnect()
})

openMqttClientMessage.registerListener(async () => {
  await mqttProvider.connect()
})

const heartBeatEvent = mqttProvider.getOrCreateTopicEvent<MqttBasePayload>('heart-beat')

chrome.alarms.create('mqtt-heart-beat', { periodInMinutes: 0.5 })
chrome.alarms.onAlarm.addListener(async (alarm) => {
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
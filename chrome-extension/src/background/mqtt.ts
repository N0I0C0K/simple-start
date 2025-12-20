import type { ILoadable } from './type'

import { mqttStateManager, settingStorage, onlineUsersStorage, ONLINE_USER_TIMEOUT_MS } from '@extension/storage'
import { MqttPayloadBuilder, MqttProvider, closeMqttClientMessage, openMqttClientMessage } from '@extension/shared'
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
mqttProvider.on('client-loaded', client => {
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
  await mqttProvider.connect({ brokerUrl: settings.mqttSettings.mqttBrokerUrl })
  payloadBuilder.username = settings.mqttSettings.username
  // because event is delay connect, so set connected here
  await mqttStateManager.setConnected(true)
  console.log('MQTT connected')
}

closeMqttClientMessage.registerListener(async () => {
  await mqttProvider.disconnect()
})

openMqttClientMessage.registerListener(async () => {
  await mqttProvider.connect()
})

const heartBeatEvent = mqttProvider.getOrCreateTopicEvent<MqttBasePayload>('heart-beat')

// Listen to heartbeat events from other users
heartBeatEvent.subscribe(async (payload: MqttBasePayload) => {
  if (payload.senderUserName) {
    await onlineUsersStorage.updateUserHeartbeat(payload.senderUserName)
  }
})

chrome.alarms.create('mqtt-heart-beat', { periodInMinutes: 0.5 })
chrome.alarms.create('mqtt-cleanup-offline-users', { periodInMinutes: 1 })

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'mqtt-heart-beat') {
    if (!mqttProvider.connected) {
      return
    }
    await heartBeatEvent.emit(payloadBuilder.buildPayload({}))
  }
  if (alarm.name === 'mqtt-cleanup-offline-users') {
    // Clean up users offline for more than 2 minutes
    await onlineUsersStorage.cleanupOfflineUsers(ONLINE_USER_TIMEOUT_MS)
  }
})

export const MqttLoader: ILoadable = {
  async load() {
    await setupMqtt()
  },
}

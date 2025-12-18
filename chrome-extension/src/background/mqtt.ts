import type { ILoadable } from './type'

import { mqttStateManager, settingStorage } from '@extension/storage'
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

chrome.alarms.create('mqtt-heart-beat', { periodInMinutes: 0.5 })
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'mqtt-heart-beat') {
    if (!mqttProvider.connected) {
      return
    }
    await heartBeatEvent.emit(payloadBuilder.buildPayload({}))
  }
})

// Listen for settings changes and update MQTT configuration
async function handleSettingsChange() {
  const settings = await settingStorage.get()
  
  // Check if MQTT is enabled and properly configured
  if (!(settings.mqttSettings?.enabled && settings.mqttSettings.secretKey)) {
    console.log('MQTT is disabled or not properly configured. Disconnecting...')
    if (mqttProvider.connected) {
      await mqttProvider.disconnect()
    }
    return
  }

  // Update secret key (this will resubscribe to topics with new prefix)
  if (mqttProvider.initialized) {
    console.log('Settings changed. Updating MQTT configuration...')
    await mqttProvider.changeSecretPrefix(settings.mqttSettings.secretKey)
  }

  // Update username for payload builder
  payloadBuilder.username = settings.mqttSettings.username

  // Reconnect if broker URL changed or if not connected
  if (!mqttProvider.connected) {
    console.log('Reconnecting to MQTT broker with new settings...')
    await mqttProvider.connect({ brokerUrl: settings.mqttSettings.mqttBrokerUrl })
    await mqttStateManager.setConnected(true)
  }
}

export const MqttLoader: ILoadable = {
  async load() {
    await setupMqtt()
    
    // Subscribe to settings changes
    settingStorage.subscribe(() => {
      handleSettingsChange().catch(error => {
        console.error('Error handling MQTT settings change:', error)
      })
    })
  },
}

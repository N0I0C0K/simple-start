import type { MqttClient } from 'mqtt/*'
import { mqttStateManager, settingStorage } from '@extension/storage'
import type { MqttProvider } from '@extension/shared'
import { generateClient } from '@extension/shared'

export let mqttProvider: MqttProvider | null = null

function initMqttClientEvent(client: MqttClient) {
  client.on('close', async () => {
    console.log('MQTT connection closed')
    await mqttStateManager.setConnected(false)
  })
  client.on('connect', async () => {
    console.log('MQTT connected')
    await mqttStateManager.setConnected(true)
  })
}

export async function setupMqtt(): Promise<MqttProvider | null> {
  const mqttSettings = await settingStorage.getMqttSettings()
  console.log('Current MQTT settings:', mqttSettings)

  if (!(mqttSettings?.enabled && mqttSettings.secretKey)) {
    console.log('MQTT is disabled or not properly configured.')
    mqttProvider = null
    return null
  }
  console.log('Connecting to MQTT broker...')
  mqttProvider = await generateClient('ws://broker.emqx.io:8083/mqtt')
  console.log('MQTT connected')
  initMqttClientEvent(mqttProvider.client)

  await mqttStateManager.setConnected(true)
  return mqttProvider
}

export async function initializeMqttState() {
  const mqttSettings = await settingStorage.getMqttSettings()
  if (mqttSettings?.enabled) {
    await setupMqtt()
  } else {
    await mqttStateManager.setConnected(false)
    mqttProvider = null
  }
}

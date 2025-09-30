import 'webextension-polyfill'
import { settingStorage } from '@extension/storage'
import type { MqttProvider } from '@extension/shared'
import { generateClient, generateEventCenter, } from '@extension/shared'

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

  mqttProvider.registerTopicCallback<string>('AHDDC/test/topic', payload => {
    console.log('Received message on test/topic:', payload)
  })

  const eventCenter = await generateEventCenter(mqttProvider)
  eventCenter.registerEvent
}

setupMqtt()

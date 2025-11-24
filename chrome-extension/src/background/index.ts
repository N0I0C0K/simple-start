import 'webextension-polyfill'
import { initializeMqttState, mqttProvider } from './mqtt-manager'
import { initializeEventCenter, drinkWaterLaunchEvent } from './event-manager'
import { onReceiveDrinkWaterLaunch } from './drink-water-handlers'
import { initializeMessageListeners } from './message-listeners'

chrome.runtime.onSuspend.addListener(() => {
  console.log('background script is being unloaded')
})

chrome.runtime.onSuspendCanceled.addListener(() => {
  console.log('background script unload was canceled')
})

async function initialize() {
  await initializeMqttState()
  
  if (mqttProvider) {
    await initializeEventCenter(mqttProvider)
    
    if (drinkWaterLaunchEvent) {
      drinkWaterLaunchEvent.registerReceiveCallback(onReceiveDrinkWaterLaunch)
    }
  }
  
  initializeMessageListeners()
}

initialize()
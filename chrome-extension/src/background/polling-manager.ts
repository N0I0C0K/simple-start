import type { events } from '@extension/shared'
import { drinkWaterEventGlobalState } from '@extension/shared'
import { drinkWaterLaunchEvent, registerConfirmEvent } from './event-manager'
import { onReceiveDrinkWaterConfirm } from './drink-water-handlers'

const LAUNCH_POLLING_INTERVAL_MS = 5000

let launchPollingHandler: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intervalId: any
  launchPayload: events.DrinkWaterLaunchPayload
} | null = null

export async function setLaunchPolling(payload: events.DrinkWaterLaunchPayload | null) {
  if (!drinkWaterLaunchEvent) return
  
  if (payload === null) {
    if (launchPollingHandler) {
      clearInterval(launchPollingHandler.intervalId)
      launchPollingHandler = null
    }
    return
  }

  if (launchPollingHandler?.launchPayload.id === payload.id) {
    return
  }

  const intervalId = setInterval(async () => {
    const state = await drinkWaterEventGlobalState.get()
    if (state.currentEvent?.id !== payload.id) {
      console.log('Stopping launch polling for event:', payload)
      clearInterval(intervalId)
      launchPollingHandler = null
      return
    }
    if (!drinkWaterLaunchEvent) return
    drinkWaterLaunchEvent.emit(payload)
  }, LAUNCH_POLLING_INTERVAL_MS)

  launchPollingHandler = {
    intervalId: intervalId,
    launchPayload: payload,
  }
  
  const confirmEvent = await registerConfirmEvent(payload)
  if (confirmEvent) {
    confirmEvent.registerReceiveCallback(onReceiveDrinkWaterConfirm)
  }
}

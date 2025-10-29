import { createStorage, settingStorage } from '@extension/storage'
import type { DrinkWaterLaunchPayload, DrinkWaterConfirmPayload, DrinkWaterAction } from '../mqtt/events'
import { useStorage } from '../hooks'
import { nanoid } from 'nanoid'
import { setLaunchPollingMessage, sendDrinkWaterConfirmMessage } from '../message'

type DrinkWaterEventState = {
  currentEvent: DrinkWaterLaunchPayload | null
  receivedConfirm: DrinkWaterConfirmPayload[] | null
  resp: DrinkWaterConfirmPayload | null
  fromLocal?: boolean
}

export const drinkWaterEventGlobalState = createStorage<DrinkWaterEventState>(
  'drink-water-global-state', {
  currentEvent: null,
  receivedConfirm: null,
  resp: null,
}
)


export type DrinkWaterStateManager = {
  readonly currentEvent: DrinkWaterLaunchPayload | null
  readonly receivedConfirm: DrinkWaterConfirmPayload[] | null
  readonly resp: DrinkWaterConfirmPayload | null
  setCurrentEvent: (value: {
    payload: DrinkWaterLaunchPayload | null
    fromLocal?: boolean
  }) => Promise<void>
  launchEvent: () => Promise<void>
  respondEvent: (action: DrinkWaterAction) => Promise<void>
  dismissEvent: () => Promise<void>
  receiveConfirm: (confirm: DrinkWaterConfirmPayload) => Promise<void>
}


export const useDrinkWaterEventManager = (): DrinkWaterStateManager => {
  const state = useStorage(drinkWaterEventGlobalState)
  const settings = useStorage(settingStorage)

  return {
    get currentEvent() {
      return state.currentEvent
    },
    get receivedConfirm() {
      return state.receivedConfirm
    },
    get resp() {
      return state.resp
    },
    async setCurrentEvent(value: {
      payload: DrinkWaterLaunchPayload | null
      fromLocal?: boolean
    }) {
      console.log('setCurrentEvent', state, value)
      const { payload, fromLocal } = value
      if (payload?.id === state.currentEvent?.id) {
        return
      }
      await drinkWaterEventGlobalState.set({
        currentEvent: payload,
        receivedConfirm: [],
        resp: null,
        fromLocal,
      })
    },
    async launchEvent() {
      if (state.currentEvent) {
        throw new Error('There is already a pending drink water event')
      }
      const id = nanoid()
      const payload: DrinkWaterLaunchPayload = {
        id,
        date: new Date().toISOString(),
        from: settings.mqttSettings?.username ?? 'unknown',
        topic: id,
      }
      await setLaunchPollingMessage.emit(payload)
      await this.setCurrentEvent({ payload })
    },
    async respondEvent(action: DrinkWaterAction) {
      if (!state.currentEvent) {
        throw new Error('No current drink water event to respond to')
      }
      const payload: DrinkWaterConfirmPayload = {
        id: nanoid(),
        eventId: state.currentEvent.id,
        date: new Date().toISOString(),
        from: settings.mqttSettings?.username ?? 'unknown',
        action,
      }
      await sendDrinkWaterConfirmMessage.emit(payload)
      await drinkWaterEventGlobalState.set((prev) => {
        return {
          ...prev,
          resp: payload,
        }
      })
    },
    async dismissEvent() {
      if (state.fromLocal) {
        await setLaunchPollingMessage.emit(null)
      }
      await this.setCurrentEvent({ payload: null })
    },
    async receiveConfirm(confirm: DrinkWaterConfirmPayload) {
      await drinkWaterEventGlobalState.set(prev => {
        if (!prev.currentEvent || prev.currentEvent.id !== confirm.eventId) {
          return prev
        }
        if (prev.receivedConfirm?.some(c => c.from === confirm.from)) {
          return prev
        }
        const recvConfirms = [...(prev.receivedConfirm || []), confirm]
        return {
          ...prev,
          receivedConfirm: recvConfirms,
        }
      })
    }
  }
}
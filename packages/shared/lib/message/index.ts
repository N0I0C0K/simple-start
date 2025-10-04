import type * as events from '../mqtt/events'

export interface Message<T> {
  name: string
  payload: T
}

export interface MessageHandler<T> {
  emit: (payload: T) => Promise<void>
  registerListener: (callback: (payload: T) => void) => void
  unregisterListener: (callback: (payload: T) => void) => void
  listeners: Array<(payload: T) => void>
  name: string
  onMessage: (message: Message<T>) => void
}

export interface MessageCenter {
  registerMessageHandler: <T>(messageName: string) => MessageHandler<T>
  unregisterMessageHandler: (messageName: string) => void
}

export const sendMessage = async <T>(message: Message<T>) => {
  await chrome.runtime.sendMessage(message)
}

const generateMessageHandler = <T>(messageName: string): MessageHandler<T> => {
  const listeners: Array<(payload: T) => void> = []
  return {
    name: messageName,
    listeners,
    emit: async function (payload: T) {
      await sendMessage<T>({ name: messageName, payload })
    },
    registerListener: function (callback: (payload: T) => void) {
      listeners.push(callback)
    },
    unregisterListener: function (callback: (payload: T) => void) {
      const index = listeners.indexOf(callback)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    },
    onMessage: function (message: Message<T>) {
      if (message.name !== messageName) return
      listeners.forEach(callback => callback(message.payload))
    },
  }
}

const generateMessageCenter = (): MessageCenter => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registeredHandlers = new Map<string, MessageHandler<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chrome.runtime.onMessage.addListener((message: Message<any>) => {
    if (!registeredHandlers.has(message.name)) return
    const handler = registeredHandlers.get(message.name)!
    handler.onMessage(message)
  })
  return {
    registerMessageHandler: <T>(messageName: string) => {
      if (registeredHandlers.has(messageName)) {
        return registeredHandlers.get(messageName)! as MessageHandler<T>
      }
      const newHandler = generateMessageHandler<T>(messageName)
      registeredHandlers.set(messageName, newHandler)
      return newHandler
    },
    unregisterMessageHandler: (messageName: string) => {
      if (!registeredHandlers.has(messageName)) return
      registeredHandlers.delete(messageName)
    },
  }
}

export const messageCenter = generateMessageCenter()
export const drinkWaterLaunchMessage =
  messageCenter.registerMessageHandler<events.DrinkWaterLaunchPayload>('drink-water-launch')
export const drinkWaterConfirmMessage =
  messageCenter.registerMessageHandler<events.DrinkWaterConfirmPayload>('drink-water-confirm')

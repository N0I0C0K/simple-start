import type { MqttProvider } from './provider'

export interface Event<T, P> {
  registerReciveCallback: (callback: (payload: P) => void) => void
  unregisterReciveCallback: (callback: (payload: P) => void) => void
  onReceive: (payload: P) => void
  emit: (payload: T) => void
  eventName: string
  registeredCallbacks: Array<(payload: P) => void>
}

export interface EventCenter {
  registerEvent: <T, P>(eventName: string) => Event<T, P>
  unregisterEvent: <T, P>(event: Event<T, P>) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: Map<string, Event<any, any>>
}

const createEvent = <T, P>(eventName: string, mqttProvider: MqttProvider): Event<T, P> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registeredCallbacks: Array<(payload: any) => void> = []
  return {
    eventName,
    registeredCallbacks,
    registerReciveCallback: function (callback: (payload: P) => void) {
      registeredCallbacks.push(callback)
    },
    unregisterReciveCallback: function (callback: (payload: P) => void) {
      registeredCallbacks.filter(cb => cb !== callback)
    },
    onReceive: function (payload: P) {
      registeredCallbacks.forEach(callback => callback(payload))
    },
    emit: function (payload: T) {
      mqttProvider.publish<T>(this.eventName, payload)
    },
  }
}

export const generateEventCenter = async (client: MqttProvider): Promise<EventCenter> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registedEvents = new Map<string, Event<any, any>>()
  return {
    events: registedEvents,
    registerEvent: <T, P>(eventName: string) => {
      if (registedEvents.has(eventName)) {
        return registedEvents.get(eventName)! as Event<T, P>
      }
      const event = createEvent<T, P>(eventName, client)
      registedEvents.set(eventName, event)
      client.registerTopicCallback<P>(eventName, event.onReceive)
      return event
    },
    unregisterEvent: <T, P>(event: Event<T, P>) => {
      if (!registedEvents.has(event.eventName)) return
      registedEvents.delete(event.eventName)
      client.unregisterTopicCallback<P>(event.eventName, event.onReceive)
    },
  }
}
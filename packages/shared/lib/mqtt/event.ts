import type { MqttProvider } from './provider'

export interface EventProps {
  eventName: string
  topic: string
}

export interface Event<T> {
  registerReceiveCallback: (callback: (payload: T) => void) => void
  unregisterReceiveCallback: (callback: (payload: T) => void) => void
  onReceive: (payload: T) => void
  emit: (payload: T) => Promise<void>
  props: EventProps
  registeredCallbacks: Array<(payload: T) => void>
}

export interface EventCenter {
  getOrRegisterEvent: <T>(eventProps: EventProps) => Event<T>
  unregisterEvent: <T>(event: Event<T>) => void
  getRegisteredEvent: <T>(eventName: string) => Event<T> | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: Map<string, Event<any>>
}

const createEvent = <T>(eventProps: EventProps, mqttProvider: MqttProvider): Event<T> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registeredCallbacks: Array<(payload: any) => void> = []
  return {
    props: eventProps,
    registeredCallbacks,
    registerReceiveCallback: function (callback: (payload: T) => void) {
      const alreadyRegistered = registeredCallbacks.find(cb => cb === callback)
      if (alreadyRegistered) return
      registeredCallbacks.push(callback)
    },
    unregisterReceiveCallback: function (callback: (payload: T) => void) {
      registeredCallbacks.filter(cb => cb !== callback)
    },
    onReceive: function (payload: T) {
      registeredCallbacks.forEach(callback => callback(payload))
    },
    emit: async function (payload: T) {
      await mqttProvider.publish<T>(eventProps.topic, payload)
    },
  }
}

export const generateEventCenter = async (client: MqttProvider): Promise<EventCenter> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registeredEvents = new Map<string, Event<any>>()
  return {
    events: registeredEvents,
    getOrRegisterEvent: <T>(eventProps: EventProps) => {
      if (registeredEvents.has(eventProps.eventName)) {
        return registeredEvents.get(eventProps.eventName)! as Event<T>
      }
      const newEvent = createEvent<T>(eventProps, client)
      registeredEvents.set(eventProps.eventName, newEvent)
      client.registerTopicCallback<T>(eventProps.topic, newEvent.onReceive)
      return newEvent
    },
    unregisterEvent: <T>(event: Event<T>) => {
      if (!registeredEvents.has(event.props.eventName)) return
      registeredEvents.delete(event.props.eventName)
      client.unregisterTopicCallback<T>(event.props.topic, event.onReceive)
    },
    getRegisteredEvent: <T>(eventName: string) => {
      if (!registeredEvents.has(eventName)) return null
      return registeredEvents.get(eventName)! as Event<T>
    },
  }
}

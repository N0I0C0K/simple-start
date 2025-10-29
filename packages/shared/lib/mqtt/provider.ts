import mqtt from 'mqtt'

class TopicEventHandler<T> {
  private topic: string
  private regx: RegExp
  private callbacks: Array<(payload: T) => void> = []

  constructor(topic: string) {
    this.topic = topic
    this.regx = new RegExp('^' + topic + '$')
  }

  public subscribe(callback: (payload: T) => void) {
    const alreadyRegistered = this.callbacks.find(cb => cb === callback)
    if (alreadyRegistered) return
    this.callbacks.push(callback)
  }

  public unsubscribe(callback: (payload: T) => void) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback)
  }

  public onReceive(topic: string, payload: T) {
    this.callbacks.forEach(callback => callback(payload))
  }

  public match(topic: string): boolean {
    return this.regx.test(topic)
  }
}

export interface MqttProvider {
  client: mqtt.MqttClient
  registerTopicCallback: <T>(topic: string, callback: (payload: T) => void) => void
  unregisterTopicCallback: <T>(topic: string, callback: (payload: T) => void) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registeredTopics: Map<string, TopicEventHandler<any>>
  get_or_create_topic_event: <T>(topic: string) => TopicEventHandler<T>
  publish: <T>(topic: string, payload: T) => Promise<void>
}

export const generateClient = async (brokerUrl: string): Promise<MqttProvider> => {
  const client = await mqtt.connectAsync(brokerUrl, {
    protocol: 'ws',
  })
  const provider: MqttProvider = {
    client,
    registeredTopics: new Map(),
    registerTopicCallback: function <T>(topic: string, callback: (payload: T) => void) {
      const topicEvent = this.get_or_create_topic_event<T>(topic)
      topicEvent.subscribe(callback)
      client.subscribe(topic)
      console.log('Registered MQTT topic callback:', topic)
    },
    unregisterTopicCallback: function <T>(topic: string, callback: (payload: T) => void) {
      const topicEvent = this.registeredTopics.get(topic)
      if (!topicEvent) return
      topicEvent.unsubscribe(callback)
    },
    get_or_create_topic_event: function <T>(topic: string) {
      if (!this.registeredTopics.has(topic)) {
        this.client.subscribe(topic)
        this.registeredTopics.set(topic, new TopicEventHandler<T>(topic))
      }
      return this.registeredTopics.get(topic)!
    },
    publish: async function <T>(topic: string, payload: T) {
      await this.client.publish(topic, JSON.stringify(payload))
    },
  }

  client.on('message', (topic: string, message: Buffer) => {
    console.log('Received message on topic:', topic, 'message:', message.toString())
    const topicEvent = provider.registeredTopics.get(topic)
    if (!topicEvent) return
    try {
      const payload = JSON.parse(message.toString())
      topicEvent.onReceive(topic, payload)
    } catch (error) {
      console.error('Error emitting topic event:', error)
    }
  })

  return provider
}

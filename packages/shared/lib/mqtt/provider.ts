import mqtt from 'mqtt'
import { EventEmitter } from 'events'

export interface MqttConnectionOptions {
  brokerUrl?: string
  useReconnect?: boolean
}

class TopicEventHandler<T> {
  private rawTopic: string
  private readonly provider: MqttProvider
  private callbacks: Array<(payload: T) => void> = []

  constructor(rawTopic: string, provider: MqttProvider) {
    this.rawTopic = rawTopic
    this.provider = provider
  }

  public subscribe(callback: (payload: T) => void) {
    const alreadyRegistered = this.callbacks.find(cb => cb === callback)
    if (alreadyRegistered) return
    this.callbacks.push(callback)
  }

  public unsubscribe(callback: (payload: T) => void): number {
    this.callbacks = this.callbacks.filter(cb => cb !== callback)
    return this.callbacks.length
  }

  public isEmpty(): boolean {
    return this.callbacks.length === 0
  }

  public onReceive(topic: string, payload: T) {
    this.callbacks.forEach(callback => callback(payload))
  }

  async emit(payload: T): Promise<void> {
    await this.provider.publish<T>(this.rawTopic, payload)
  }
}

type MqttProviderEventMap = {
  'client-loaded': [mqtt.MqttClient]
}

class MqttSecretPrefixTopicRegisterService {
  private registeredSecretTopics: Set<string> = new Set() // topics registered with secret prefix
  private rawTopics: Set<string> = new Set() // raw topics without secret prefix
  private _secretPrefix: string | null = null
  private _client: mqtt.MqttClient | null = null


  get secretPrefix(): string {
    if (!this._secretPrefix) {
      throw new Error('Secret prefix is not set')
    }
    return this._secretPrefix
  }

  isTopicRegistered(topic: string): boolean {
    const secretTopic = this.joinSecretPrefix(topic)
    return this.registeredSecretTopics.has(secretTopic)
  }

  joinSecretPrefix(rawTopic: string): string {
    return `${this.secretPrefix}/${rawTopic}`
  }

  removeSecretPrefix(secretTopic: string): string {
    const prefixWithSlash = this.secretPrefix + '/'
    if (secretTopic.startsWith(prefixWithSlash)) {
      return secretTopic.slice(prefixWithSlash.length)
    }
    return secretTopic
  }

  async setSecretPrefix(newPrefix: string) {
    if (this._secretPrefix === newPrefix) return
    await this.unSubscribeAll()
    this._secretPrefix = newPrefix
    await this.subscribeAll()
  }

  async setMqttClient(client: mqtt.MqttClient) {
    if (this._client === client) return
    if (this._client) {
      await this.unSubscribeAll()
    }
    this._client = client
    await this.subscribeAll()
  }

  async registerTopic(topic: string) {
    this.rawTopics.add(topic)
    const secretTopic = this.joinSecretPrefix(topic)
    await this.subscribeTopic(secretTopic)
  }

  async unregisterTopic(topic: string) {
    this.rawTopics.delete(topic)
    const secretTopic = this.joinSecretPrefix(topic)
    await this.unSubscribeTopic(secretTopic)
  }

  private async subscribeTopic(secretTopic: string) {
    if (!this._client) {
      return
    }
    await this._client.subscribeAsync(secretTopic)
    this.registeredSecretTopics.add(secretTopic)
    console.log('Subscribed to topic:', secretTopic)
  }

  private async unSubscribeTopic(secretTopic: string) {
    if (!this._client) {
      return
    }
    await this._client.unsubscribeAsync(secretTopic)
    this.registeredSecretTopics.delete(secretTopic)
    console.log('Unsubscribed from topic:', secretTopic)
  }

  // Subscribe to all raw topics with the current secret prefix
  async subscribeAll() {
    if (!this._client) {
      return
    }
    const topics = Array.from(this.rawTopics).map(topic => this.joinSecretPrefix(topic))
    if (topics.length === 0) return
    await this._client.subscribeAsync(topics)
    topics.forEach(topic => this.registeredSecretTopics.add(topic))
    console.log('Subscribed to all topics with secret prefix:', topics)
  }

  // Unsubscribe from all registered secret topics
  async unSubscribeAll() {
    if (!this._client) {
      return
    }
    const topics = Array.from(this.registeredSecretTopics)
    if (topics.length === 0) return
    await this._client.unsubscribeAsync(topics)
    this.registeredSecretTopics.clear()
    console.log('Unsubscribed from all topics with secret prefix:', topics)
  }
}

/**
 * MQTT Provider class for managing MQTT connections and message handling.
 * Provides topic subscription, publishing, and event handling capabilities.
 */
export class MqttProvider extends EventEmitter<MqttProviderEventMap> {
  private _clientInner: mqtt.MqttClient | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registeredTopics: Map<string, TopicEventHandler<any>> = new Map()
  private brokerUrl: string
  private _secretPrefix?: string
  private topicRegisterService: MqttSecretPrefixTopicRegisterService

  constructor(brokerUrl: string) {
    super()
    this.brokerUrl = brokerUrl
    this.topicRegisterService = new MqttSecretPrefixTopicRegisterService()

    this.on('client-loaded', async client => {
      try {
        await this.topicRegisterService.setSecretPrefix(this.secretPrefix)
        await this.topicRegisterService.setMqttClient(client)
      } catch (error) {
        // Ensure initialization failures in the client-loaded handler are visible
        console.error('Failed to initialize MQTT topicRegisterService on client-loaded event', error)
      }
    })
  }

  get connected(): boolean {
    return this._clientInner?.connected || false
  }

  get initialized(): boolean {
    return this._clientInner !== null
  }

  get secretPrefix(): string {
    if (!this._secretPrefix) {
      throw new Error('Secret prefix is not set')
    }
    return this._secretPrefix
  }

  get client(): mqtt.MqttClient {
    if (!this._clientInner) {
      throw new Error('MQTT client is not initialized')
    }
    return this._clientInner
  }

  /**
   * Changes the secret prefix and resubscribes to all topics with the new prefix.
   * @param newPrefix - The new secret prefix to use
   */
  async changeSecretPrefix(newPrefix: string) {
    await this.topicRegisterService.setSecretPrefix(newPrefix)
    this._secretPrefix = newPrefix
  }

  async connect(options?: MqttConnectionOptions) {
    const { brokerUrl, useReconnect = true } = options || {}
    if (brokerUrl) {
      this.brokerUrl = brokerUrl
    }

    if (this._clientInner) {
      if (this._clientInner.connected) {
        return
      }
      if (useReconnect) {
        this._clientInner.reconnect()
        return
      }
    }

    try {
      this._clientInner = await mqtt.connectAsync(this.brokerUrl, {
        protocol: 'ws',
      })
    } catch (error) {
      this._clientInner = null
      console.error('Failed to connect to MQTT broker:', error)
      throw error
    }
    this.emit('client-loaded', this._clientInner)

    this._clientInner.on('message', (topic: string, message: Buffer) => {
      const rawTopic = this.topicRegisterService.removeSecretPrefix(topic)
      const topicEvent = this.registeredTopics.get(rawTopic)
      if (!topicEvent) return
      try {
        const payload = JSON.parse(message.toString())
        topicEvent.onReceive(rawTopic, payload)
      } catch (error) {
        console.error('Error emitting topic event:', error)
      }
    })

    await this.topicRegisterService.subscribeAll()
  }

  async disconnect() {
    if (!this._clientInner || !this._clientInner.connected) return
    await this._clientInner.endAsync()
  }

  registerTopicCallback<T>(topic: string, callback: (payload: T) => void) {
    const topicEvent = this.getOrCreateTopicEvent<T>(topic)
    topicEvent.subscribe(callback)
    console.log('Registered MQTT topic callback:', topic)
  }

  unregisterTopicCallback<T>(topic: string, callback: (payload: T) => void) {
    const topicEvent = this.registeredTopics.get(topic)
    if (!topicEvent) return
    topicEvent.unsubscribe(callback)
    if (topicEvent.isEmpty()) {
      // No more callbacks, remove the topic
      // Ensure delete first to avoid race conditions
      this.registeredTopics.delete(topic)
      this.topicRegisterService.unregisterTopic(topic)
    }
  }

  getOrCreateTopicEvent<T>(topic: string): TopicEventHandler<T> {
    if (!this.registeredTopics.has(topic)) {
      this.topicRegisterService.registerTopic(topic)
      this.registeredTopics.set(topic, new TopicEventHandler<T>(topic, this))
    }
    return this.registeredTopics.get(topic)!
  }

  async publish<T>(topic: string, payload: T): Promise<void> {
    const secretTopic = this.topicRegisterService.joinSecretPrefix(topic)
    await this.client.publishAsync(secretTopic, JSON.stringify(payload))
  }
}

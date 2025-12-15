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

/**
 * MQTT Provider class for managing MQTT connections and message handling.
 * Provides topic subscription, publishing, and event handling capabilities.
 */
export class MqttProvider {
  private _clientInner: mqtt.MqttClient | null = null
  readonly eventEmitter: EventEmitter<{
    'client-loaded': [mqtt.MqttClient]
  }> = new EventEmitter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registeredTopics: Map<string, TopicEventHandler<any>> = new Map()
  private registeredTopicsSet: Set<string> = new Set()
  private brokerUrl: string
  private _secretPrefix?: string

  constructor(brokerUrl: string) {
    this.brokerUrl = brokerUrl
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

  createSecretTopic(rawTopic: string): string {
    return `${this.secretPrefix}/${rawTopic}`
  }

  removeSecretTopic(secretTopic: string): string {
    const prefixWithSlash = this.secretPrefix + '/'
    if (secretTopic.startsWith(prefixWithSlash)) {
      return secretTopic.slice(prefixWithSlash.length)
    }
    return secretTopic
  }

  /**
   * Changes the secret prefix and resubscribes to all topics with the new prefix.
   * @param newPrefix - The new secret prefix to use
   */
  async changeSecretPrefix(newPrefix: string) {
    await this.unSubscribeAll()
    this._secretPrefix = newPrefix
    await this.reSubscribeAll()
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
    this.eventEmitter.emit('client-loaded', this._clientInner)

    this._clientInner.on('message', (topic: string, message: Buffer) => {
      console.info('Received message on topic:', topic, 'message:', message.toString())
      const rawTopic = this.removeSecretTopic(topic)
      const topicEvent = this.registeredTopics.get(rawTopic)
      if (!topicEvent) return
      try {
        const payload = JSON.parse(message.toString())
        topicEvent.onReceive(rawTopic, payload)
      } catch (error) {
        console.error('Error emitting topic event:', error)
      }
    })

    await this.reSubscribeAll()
  }

  async disconnect() {
    if (!this._clientInner || !this._clientInner.connected) return
    await this._clientInner.endAsync()
  }

  async reSubscribeAll() {
    if (!this._clientInner) return
    const topics = Array.from(this.registeredTopicsSet).map(topic => this.createSecretTopic(topic))
    if (topics.length === 0) return
    console.log('Re-subscribing to topics:', topics)
    await this.client.subscribeAsync(topics)
  }

  async unSubscribeAll() {
    if (!this._clientInner) return
    const topics = Array.from(this.registeredTopicsSet).map(topic => this.createSecretTopic(topic))
    if (topics.length === 0) return
    console.log('Unsubscribing from topics:', topics)
    await this.client.unsubscribeAsync(topics)
  }

  subscribe(topic: string) {
    this.registeredTopicsSet.add(topic)
    if (!this._clientInner) {
      return
    }
    const secretTopic = this.createSecretTopic(topic)
    console.log('Subscribing to topic:', secretTopic)
    this.client.subscribe(secretTopic)
  }

  unregisterTopic(topic: string) {
    this.registeredTopicsSet.delete(topic)
    if (!this._clientInner) {
      return
    }
    const secretTopic = this.createSecretTopic(topic)
    console.log('Unsubscribing from topic:', secretTopic)
    this.client.unsubscribe(secretTopic)
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
      this.unregisterTopic(topic)
    }
  }

  getOrCreateTopicEvent<T>(topic: string): TopicEventHandler<T> {
    if (!this.registeredTopics.has(topic)) {
      this.subscribe(topic)
      this.registeredTopics.set(topic, new TopicEventHandler<T>(topic, this))
    }
    return this.registeredTopics.get(topic)!
  }

  async publish<T>(topic: string, payload: T): Promise<void> {
    const secretTopic = this.createSecretTopic(topic)
    console.info('Publishing to topic:', secretTopic, 'payload:', payload)
    await this.client.publishAsync(secretTopic, JSON.stringify(payload))
  }
}

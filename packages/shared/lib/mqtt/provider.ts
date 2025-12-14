import mqtt from 'mqtt'

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
  private _messageHandlerRegistered = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registeredTopics: Map<string, TopicEventHandler<any>> = new Map()
  private registeredTopicsSet: Set<string> = new Set()
  private brokerUrl: string
  private _secretPrefix?: string

  /**
   * Creates a new MqttProvider instance.
   * @param brokerUrl - The MQTT broker URL to connect to
   */
  constructor(brokerUrl: string) {
    this.brokerUrl = brokerUrl
  }

  /**
   * Returns whether the MQTT client is currently connected.
   */
  get connected(): boolean {
    return this._clientInner?.connected || false
  }

  /**
   * Returns whether the MQTT client has been initialized.
   */
  get initialized(): boolean {
    return this._clientInner !== null
  }

  /**
   * Gets the secret prefix used for topic encryption.
   * @throws Error if secret prefix is not set
   */
  get secretPrefix(): string {
    if (!this._secretPrefix) {
      throw new Error('Secret prefix is not set')
    }
    return this._secretPrefix
  }

  /**
   * Gets the underlying MQTT client instance.
   * @throws Error if client is not initialized
   */
  get client(): mqtt.MqttClient {
    if (!this._clientInner) {
      throw new Error('MQTT client is not initialized')
    }
    return this._clientInner
  }

  /**
   * Creates a secret topic by prepending the secret prefix.
   * @param rawTopic - The raw topic name
   * @returns The secret topic with prefix
   */
  createSecretTopic(rawTopic: string): string {
    return `${this.secretPrefix}/${rawTopic}`
  }

  /**
   * Removes the secret prefix from a topic.
   * @param secretTopic - The topic with secret prefix
   * @returns The raw topic without prefix
   */
  removeSecretTopic(secretTopic: string): string {
    const prefixWithSlash = this.secretPrefix + '/'
    if (secretTopic.startsWith(prefixWithSlash)) {
      return secretTopic.slice(prefixWithSlash.length)
    }
    return secretTopic
  }

  /**
   * Sets the secret prefix. If already initialized, unsubscribes and resubscribes with new prefix.
   * @param newPrefix - The new secret prefix to use
   */
  set secretPrefix(newPrefix: string) {
    this._secretPrefix = newPrefix
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

  /**
   * Connects to the MQTT broker.
   * @param options - Connection options including broker URL and reconnect behavior
   * @throws Error if connection fails
   */
  async connect(options?: MqttConnectionOptions) {
    const { brokerUrl, useReconnect = true } = options || {}
    if (brokerUrl) {
      this.brokerUrl = brokerUrl
    }

    if (this._clientInner) {
      if (this._clientInner.connected) {
        console.log('MQTT client already connected')
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

    // Register message handler only once
    if (!this._messageHandlerRegistered) {
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
      this._messageHandlerRegistered = true
    }

    await this.reSubscribeAll()
  }

  /**
   * Disconnects from the MQTT broker.
   */
  async disconnect() {
    if (!this._clientInner || !this._clientInner.connected) return
    await this._clientInner.endAsync()
  }

  /**
   * Resubscribes to all registered topics. Called after connection or secret prefix change.
   */
  async reSubscribeAll() {
    if (!this._clientInner) return
    const topics = Array.from(this.registeredTopicsSet).map(topic => this.createSecretTopic(topic))
    if (topics.length === 0) return
    console.log('Re-subscribing to topics:', topics)
    await this.client.subscribeAsync(topics)
  }

  /**
   * Unsubscribes from all registered topics. Called before secret prefix change or disconnect.
   */
  async unSubscribeAll() {
    if (!this._clientInner) return
    const topics = Array.from(this.registeredTopicsSet).map(topic => this.createSecretTopic(topic))
    if (topics.length === 0) return
    console.log('Unsubscribing from topics:', topics)
    await this.client.unsubscribeAsync(topics)
  }

  /**
   * Subscribes to a topic. If client is not connected, subscription is deferred.
   * @param topic - The raw topic name (without secret prefix)
   */
  subscribe(topic: string) {
    this.registeredTopicsSet.add(topic)
    if (!this._clientInner) {
      return
    }
    const secretTopic = this.createSecretTopic(topic)
    console.log('Subscribing to topic:', secretTopic)
    this.client.subscribe(secretTopic)
  }

  /**
   * Unregisters a topic and unsubscribes from it.
   * @param topic - The raw topic name (without secret prefix)
   */
  unregisterTopic(topic: string) {
    this.registeredTopicsSet.delete(topic)
    if (!this._clientInner) {
      return
    }
    const secretTopic = this.createSecretTopic(topic)
    console.log('Unsubscribing from topic:', secretTopic)
    this.client.unsubscribe(secretTopic)
  }

  /**
   * Registers a callback for a topic. Creates the topic event handler if needed.
   * @param topic - The raw topic name (without secret prefix)
   * @param callback - The callback to invoke when messages are received
   */
  registerTopicCallback<T>(topic: string, callback: (payload: T) => void) {
    const topicEvent = this.getOrCreateTopicEvent<T>(topic)
    topicEvent.subscribe(callback)
    console.log('Registered MQTT topic callback:', topic)
  }

  /**
   * Unregisters a callback from a topic. Removes the topic if no callbacks remain.
   * @param topic - The raw topic name (without secret prefix)
   * @param callback - The callback to remove
   */
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

  /**
   * Gets or creates a topic event handler for the given topic.
   * @param topic - The raw topic name (without secret prefix)
   * @returns The topic event handler
   */
  getOrCreateTopicEvent<T>(topic: string): TopicEventHandler<T> {
    if (!this.registeredTopics.has(topic)) {
      this.subscribe(topic)
      this.registeredTopics.set(topic, new TopicEventHandler<T>(topic, this))
    }
    return this.registeredTopics.get(topic)!
  }

  /**
   * Publishes a message to a topic.
   * @param topic - The raw topic name (without secret prefix)
   * @param payload - The payload to publish
   */
  async publish<T>(topic: string, payload: T): Promise<void> {
    const secretTopic = this.createSecretTopic(topic)
    console.info('Publishing to topic:', secretTopic, 'payload:', payload)
    await this.client.publishAsync(secretTopic, JSON.stringify(payload))
  }
}

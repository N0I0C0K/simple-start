import type { MqttBasePayload } from "./payload"

export class MqttPayloadBuilder {
  private _username?: string
  constructor(username?: string) {
    this._username = username
  }
  set username(name: string) {
    this._username = name
  }
  get username(): string {
    if (!this._username) {
      throw new Error('Username is not set for MqttPayloadBuilder')
    }
    return this._username
  }
  buildPayload<T>(data: T): T & MqttBasePayload {
    return {
      ...data,
      senderUserName: this.username,
      timestamp: Date.now(),
    }
  }
}
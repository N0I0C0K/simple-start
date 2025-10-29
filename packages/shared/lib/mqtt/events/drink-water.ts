export interface DrinkWaterLaunchPayload {
  date: string
  from: string
  id: string
  topic: string
}

export type DrinkWaterAction = 'accept' | 'reject'

export interface DrinkWaterConfirmPayload {
  date: string
  from: string
  id: string
  eventId: string
  action: DrinkWaterAction
}

import { useEffect, useMemo, type FC } from 'react'
import { receiveDrinkWaterLaunchMessage, receiveDrinkWaterConfirmMessage, type events } from '@extension/shared'
import { Stack, TooltipButton, cn, Text, Space, Avatar, AvatarFallback, Separator } from '@extension/ui'
import { Check, X } from 'lucide-react'
import moment from 'moment'
import { useDrinkWaterEventManager } from '@extension/shared/lib/state/events'
import type { DrinkWaterLaunchPayload } from '@extension/shared/lib/mqtt/events'

const CupPng = () => {
  return (
    <img className="w-10 h-10" src="https://img.icons8.com/?size=100&id=12873&format=png&color=000000" alt="coffee" />
  )
}

const DrinkPanel: FC<{ className?: string; id: string | number; payload: events.DrinkWaterLaunchPayload }> = ({
  className,
  id,
  payload,
}) => {
  const payloadDate = useMemo(() => {
    return moment(payload.date)
  }, [payload])
  const drinkWaterManager = useDrinkWaterEventManager()
  return (
    <Stack direction={'column'} className={cn('shadow-lg p-4', className)}>
      <Stack
        direction={'row'}
        center
        style={
          {
            // width: 356,
          }
        }>
        <CupPng />
        <Stack direction={'column'} className="ml-2">
          <Text className="select-none">Time to drink water!</Text>
          <Text className="select-none -mt-1" level="s" gray>
            From {payload.from} at {payloadDate.format('HH:mm')}
          </Text>
        </Stack>
        <Space />
        <TooltipButton
          tooltip="Drink!"
          variant="ghost"
          size={'icon'}
          className={cn('rounded-full text-green-700')}
          onClick={async () => {
            await drinkWaterManager.respondEvent('accept')
          }}>
          <Check size={32} strokeWidth={4} />
        </TooltipButton>
        <TooltipButton
          tooltip="Nope"
          variant="ghost"
          size={'icon'}
          className={cn('rounded-full text-red-700')}
          onClick={async () => {
            await drinkWaterManager.respondEvent('reject')
          }}>
          <X size={32} strokeWidth={4} />
        </TooltipButton>
        <TooltipButton
          className="absolute bg-background right-1 top-1 translate-x-1/2 -translate-y-1/2 rounded-full size-4"
          tooltip="Close"
          variant="secondary"
          size={'icon'}
          onClick={() => {
            //toast.dismiss(id)
            drinkWaterManager.dismissEvent()
          }}>
          <X strokeWidth={3} className="text-gray-500" />
        </TooltipButton>
      </Stack>
      <Separator className="my-2" />
      <Stack direction={'row'} className="flex -space-x-2 *:ring-2">
        {drinkWaterManager.receivedConfirm?.map(confirm => (
          <Avatar
            key={confirm.id}
            data-action={confirm.action}
            className="data-[action=accept]:ring-green-500/60 data-[action=reject]:ring-red-500/60">
            <AvatarFallback>{confirm.from}</AvatarFallback>
          </Avatar>
        ))}
      </Stack>
    </Stack>
  )
}

export const DrinkWaterEventMountComponent: FC = () => {
  const drinkWaterManager = useDrinkWaterEventManager()
  useEffect(() => {
    const setCurrentEvent = (payload: DrinkWaterLaunchPayload | null) => {
      drinkWaterManager.setCurrentEvent({ payload })
    }
    receiveDrinkWaterLaunchMessage!.registerListener(setCurrentEvent)
    receiveDrinkWaterConfirmMessage!.registerListener(drinkWaterManager.receiveConfirm)
    return () => {
      receiveDrinkWaterLaunchMessage!.unregisterListener(setCurrentEvent)
      receiveDrinkWaterConfirmMessage!.unregisterListener(drinkWaterManager.receiveConfirm)
    }
  }, [drinkWaterManager])

  return (
    <>
      {drinkWaterManager.currentEvent && (
        <DrinkPanel
          className="fixed top-4 left-4 bg-background rounded-md w-80"
          id={drinkWaterManager.currentEvent.id}
          payload={drinkWaterManager.currentEvent}
        />
      )}
    </>
  )
}

import { useEffect, useMemo, useState, type FC } from 'react'
import { receiveDrinkWaterLaunchMessage, receiveDrinkWaterConfirmMessage, type events } from '@extension/shared'
import { Stack, TooltipButton, cn, Text, Space, Avatar, AvatarFallback, Separator, Badge } from '@extension/ui'
import { Check, X, Droplets, Clock } from 'lucide-react'
import moment from 'moment'
import { useDrinkWaterEventManager } from '@extension/shared/lib/state/events'
import type { DrinkWaterLaunchPayload } from '@extension/shared/lib/mqtt/events'

const CupPng = () => {
  return (
    <div className="relative">
      <Droplets className="w-12 h-12 text-blue-500" strokeWidth={1.5} />
      <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full animate-pulse" />
    </div>
  )
}

const DrinkPanel: FC<{ className?: string; id: string | number; payload: events.DrinkWaterLaunchPayload }> = ({
  className,
  payload,
}) => {
  const drinkWaterManager = useDrinkWaterEventManager()
  const [isHoveringAccept, setIsHoveringAccept] = useState(false)
  const [isHoveringReject, setIsHoveringReject] = useState(false)
  
  const hasResponded = drinkWaterManager.resp !== null
  const userResponse = drinkWaterManager.resp?.action
  const timeAgo = useMemo(() => {
    return moment(payload.date).fromNow()
  }, [payload.date])

  return (
    <Stack 
      direction={'column'} 
      className={cn(
        'shadow-2xl p-5 backdrop-blur-sm border-2 transition-all duration-300 animate-in slide-in-from-top-4 fade-in',
        hasResponded 
          ? userResponse === 'accept' 
            ? 'border-green-500/30 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20' 
            : 'border-red-500/30 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
          : 'border-blue-500/20 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
        className
      )}
    >
      <Stack direction={'row'} center className="relative">
        <div className="relative">
          <CupPng />
        </div>
        <Stack direction={'column'} className="ml-4 flex-1">
          <div className="flex items-center gap-2">
            <Text className="select-none font-semibold text-lg">Time to drink water!</Text>
            {hasResponded && (
              <Badge 
                variant={userResponse === 'accept' ? 'default' : 'destructive'}
                className={cn(
                  'animate-in fade-in zoom-in-50',
                  userResponse === 'accept' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                )}
              >
                {userResponse === 'accept' ? 'Accepted' : 'Declined'}
              </Badge>
            )}
          </div>
          <Stack direction={'row'} className="items-center gap-2 mt-1">
            <Text className="select-none text-sm opacity-70 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </Text>
            <Text className="select-none text-sm opacity-70">
              • From {payload.from}
            </Text>
          </Stack>
        </Stack>
        <Space />
        {!hasResponded && (
          <Stack direction={'row'} className="gap-2">
            <TooltipButton
              tooltip="I'm drinking!"
              variant="ghost"
              size={'icon'}
              className={cn(
                'rounded-full transition-all duration-200 hover:scale-110',
                'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/40',
                'text-green-700 dark:text-green-400',
                isHoveringAccept && 'ring-4 ring-green-400/50 shadow-lg shadow-green-500/50'
              )}
              onMouseEnter={() => setIsHoveringAccept(true)}
              onMouseLeave={() => setIsHoveringAccept(false)}
              onClick={async () => {
                await drinkWaterManager.respondEvent('accept')
              }}>
              <Check size={28} strokeWidth={3} />
            </TooltipButton>
            <TooltipButton
              tooltip="Not now"
              variant="ghost"
              size={'icon'}
              className={cn(
                'rounded-full transition-all duration-200 hover:scale-110',
                'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/40',
                'text-red-700 dark:text-red-400',
                isHoveringReject && 'ring-4 ring-red-400/50 shadow-lg shadow-red-500/50'
              )}
              onMouseEnter={() => setIsHoveringReject(true)}
              onMouseLeave={() => setIsHoveringReject(false)}
              onClick={async () => {
                await drinkWaterManager.respondEvent('reject')
              }}>
              <X size={28} strokeWidth={3} />
            </TooltipButton>
          </Stack>
        )}
        <TooltipButton
          className={cn(
            'absolute bg-background/80 backdrop-blur-sm right-1 top-1 translate-x-1/2 -translate-y-1/2 rounded-full size-6',
            'hover:bg-background transition-all duration-200 hover:scale-110'
          )}
          tooltip="Close"
          variant="secondary"
          size={'icon'}
          onClick={() => {
            drinkWaterManager.dismissEvent()
          }}>
          <X strokeWidth={3} className="text-gray-500 w-4 h-4" />
        </TooltipButton>
      </Stack>
      
      {drinkWaterManager.receivedConfirm && drinkWaterManager.receivedConfirm.length > 0 && (
        <>
          <Separator className="my-3 bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="space-y-2">
            <Text className="text-xs opacity-60 font-medium">Team responses:</Text>
            <Stack direction={'row'} className="flex -space-x-2 *:ring-2 *:transition-all *:duration-200 hover:*:scale-110">
              {drinkWaterManager.receivedConfirm?.map(confirm => (
                <Avatar
                  key={confirm.id}
                  data-action={confirm.action}
                  className={cn(
                    'cursor-pointer',
                    'data-[action=accept]:ring-green-500/60 data-[action=accept]:bg-green-100 dark:data-[action=accept]:bg-green-900/40',
                    'data-[action=reject]:ring-red-500/60 data-[action=reject]:bg-red-100 dark:data-[action=reject]:bg-red-900/40'
                  )}
                >
                  <AvatarFallback className="font-semibold">
                    {confirm.from}
                  </AvatarFallback>
                </Avatar>
              ))}
            </Stack>
          </div>
        </>
      )}
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
          className="fixed top-4 left-4 rounded-xl w-96 shadow-2xl"
          id={drinkWaterManager.currentEvent.id}
          payload={drinkWaterManager.currentEvent}
        />
      )}
    </>
  )
}

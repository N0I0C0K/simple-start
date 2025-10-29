import * as React from 'react'

import type { ButtonProps } from './button'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip'

export const TooltipButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    tooltip: React.ReactNode | string
  }
>(({ tooltip, ...props }, ref) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button ref={ref} {...props} />
        </TooltipTrigger>
        <TooltipContent className="">{React.isValidElement(tooltip) ? tooltip : <span>{tooltip}</span>}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})
TooltipButton.displayName = 'TooltipButton'

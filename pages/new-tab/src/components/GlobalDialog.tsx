import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@extension/ui/lib/components'
import type { GlobalDialogInnerProps } from '@src/provider'
import { GlobalDialogContext } from '@src/provider/global-dialog'
import type { ReactElement } from 'react'
import { useEffect, useState, type FC } from 'react'

export const GlobalDialog: FC<{
  children: ReactElement
}> = ({ children }) => {
  const [dialogState, setDialogState] = useState<GlobalDialogInnerProps>({ open: false })
  return (
    <>
      <GlobalDialogContext.Provider value={[dialogState, setDialogState]}>{children}</GlobalDialogContext.Provider>
      <Dialog
        open={dialogState.open}
        onOpenChange={open => {
          setDialogState({ open })
        }}>
        <DialogContent>
          <DialogHeader>
            {dialogState.title && <DialogTitle>{dialogState.title}</DialogTitle>}
            {dialogState.description && <DialogDescription>{dialogState.description}</DialogDescription>}
          </DialogHeader>
          {dialogState.showElement!}
        </DialogContent>
      </Dialog>
    </>
  )
}

import { getDefaultIconUrl } from '@/lib/url'
import { cn, useBoolean } from '@/lib/utils'
import { useStorage } from '@extension/shared'
import { historySuggestStorage } from '@extension/storage'
import { command, ScrollArea, Text } from '@extension/ui'
import { useState, type FC } from 'react'

export const CommandModule: FC<{
  className?: string
}> = ({ className }) => {
  const history = useStorage(historySuggestStorage)
  const [focus, focusFunc] = useBoolean(false)
  const [inputVal, setInputVal] = useState('')

  return (
    <command.Command className={cn('rounded-2xl shadow-lg', className)}>
      <command.CommandInput
        onFocus={focusFunc.setTrue}
        onBlur={focusFunc.setFalse}
        value={inputVal}
        onValueChange={newVal => {
          setInputVal(newVal)
        }}
        placeholder="search..."
      />
      {focus && (
        <ScrollArea className="max-h-80">
          <command.CommandList className="">
            <command.CommandEmpty>No results found.</command.CommandEmpty>
            <command.CommandGroup heading="history">
              {history.slice(0, 4).map(val => {
                return (
                  <command.CommandItem
                    key={val.id}
                    onSelect={val => {
                      console.log(val)
                    }}>
                    <img src={getDefaultIconUrl(val.url)} className="size-5 rounded-md mx-3" alt="list-icon" />
                    <span>{val.title}</span>
                  </command.CommandItem>
                )
              })}
            </command.CommandGroup>
          </command.CommandList>
        </ScrollArea>
      )}
    </command.Command>
  )
}

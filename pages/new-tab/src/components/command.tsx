import { cn, useBoolean } from '@/lib/utils'
import { useDebounce, useStorage } from '@extension/shared'
import { settingStorage } from '@extension/storage'
import { command, ScrollArea, Stack, Text } from '@extension/ui'
import { commandResolverService } from '@src/service/command-reslover'
import type { CommandQueryParams, ICommandResultGroup } from '@src/service/command-reslover'
import { useEffect, useState, type FC } from 'react'

export const CommandModule: FC<{
  className?: string
}> = ({ className }) => {
  const [focus, focusFunc] = useBoolean(false)
  const [inputVal, setInputVal] = useState('')
  const [result, setResult] = useState<ICommandResultGroup[]>([])
  const inputDelay = useDebounce(inputVal, 600)

  useEffect(() => {
    const query: CommandQueryParams = {
      query: inputDelay,
    }
    setResult([])
    commandResolverService.resolve(query, group => {
      setResult(prev => [...prev, group])
    })
  }, [inputDelay])

  const setting = useStorage(settingStorage)

  return (
    <command.Command className={cn('rounded-2xl', className)} shouldFilter={false}>
      <command.CommandInput
        onFocus={focusFunc.setTrue}
        onBlur={focusFunc.setFalse}
        value={inputVal}
        onValueChange={newVal => {
          setInputVal(newVal)
        }}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={setting.autoFocusCommandInput}
        placeholder="search..."
        className="h-14 text-lg"
      />
      {focus && (
        <ScrollArea className="max-h-80">
          <command.CommandList>
            <command.CommandEmpty>No results found.</command.CommandEmpty>
            {result.map(val => {
              return (
                <command.CommandGroup heading={val.groupName} key={val.groupName}>
                  {val.result.map(res => {
                    return (
                      <command.CommandItem
                        key={res.id}
                        value={res.id}
                        onSelect={res.onSelect}
                        className="py-1.5 w-full">
                        <Stack center>
                          <img src={res.iconUrl} className="size-6 rounded-md mx-3" alt="list-icon" />
                          <Stack direction={'column'}>
                            <Text level="s" className="line-clamp-1">
                              {res.title}
                            </Text>
                            <Text level="xs" className="line-clamp-1" gray>
                              {res.description}
                            </Text>
                          </Stack>
                        </Stack>
                      </command.CommandItem>
                    )
                  })}
                </command.CommandGroup>
              )
            })}
          </command.CommandList>
        </ScrollArea>
      )}
    </command.Command>
  )
}

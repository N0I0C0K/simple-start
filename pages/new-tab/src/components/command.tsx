import { cn, useBoolean } from '@/lib/utils'
import { useDebounce, useStorage } from '@extension/shared'
import { settingStorage } from '@extension/storage'
import { command, Stack, Text } from '@extension/ui'
import { commandResolverService } from '@src/service/command-reslover'
import type { CommandQueryParams, ICommandResultGroup } from '@src/service/command-reslover'
import { useEffect, useRef, useState, type FC } from 'react'

const CommandItemIcon: FC<{ iconUrl?: string; IconType?: React.ElementType }> = ({ iconUrl, IconType }) => {
  return (
    <>
      {iconUrl && <img src={iconUrl} alt="icon" className="size-6 rounded-md mx-3" />}
      {IconType && <IconType className="stroke-2 h-10 w-10 mx-3" />}
    </>
  )
}

export const CommandModule: FC<{
  className?: string
}> = ({ className }) => {
  const [focus, focusFunc] = useBoolean(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputVal, setInputVal] = useState('')
  const [result, setResult] = useState<ICommandResultGroup[]>([])
  const inputDelay = useDebounce(inputVal, 600)
  const [isWindows] = useState(() => {
    return navigator.userAgent.toLowerCase().includes('windows')
  })
  const keyBindings = isWindows ? 'Alt+K' : '⌘+K'

  useEffect(() => {
    const query: CommandQueryParams = {
      query: inputDelay,
    }
    setResult([])
    commandResolverService.resolve(query, group => {
      setResult(prev => [...prev, group])
    })
  }, [inputDelay])

  useEffect(() => {
    const listener = (ev: KeyboardEvent) => {
      if (
        (isWindows && ev.altKey && (ev.key === 'k' || ev.key === 'K')) ||
        (!isWindows && ev.metaKey && (ev.key === 'k' || ev.key === 'K'))
      ) {
        focusFunc.setTrue()
        inputRef.current?.focus()
      }
      if (ev.key === 'Escape') {
        focusFunc.setFalse()
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [focusFunc, isWindows])

  const setting = useStorage(settingStorage)

  return (
    <command.Command
      className={cn('rounded-2xl', className)}
      shouldFilter={false}
      onValueChange={val => {
        console.log('value change:', val)
      }}>
      <command.CommandInput
        onFocus={focusFunc.setTrue}
        onBlur={focusFunc.setFalse}
        value={inputVal}
        ref={inputRef}
        onValueChange={newVal => {
          setInputVal(newVal)
        }}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={setting.autoFocusCommandInput}
        placeholder="search..."
        className="h-14 md:h-12 text-lg md:text-base"
        keyBindings={keyBindings}
      />
      {focus && (
        <command.CommandList className="max-h-80">
          <command.CommandEmpty>No results found.</command.CommandEmpty>
          {result.map(val => {
            return (
              <command.CommandGroup heading={val.groupName} key={val.groupName}>
                {val.result.map(res => {
                  return (
                    <command.CommandItem key={res.id} value={res.id} onSelect={res.onSelect} className="py-1.5 w-full">
                      <Stack center>
                        <CommandItemIcon iconUrl={res.iconUrl} IconType={res.IconType} />
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
      )}
    </command.Command>
  )
}

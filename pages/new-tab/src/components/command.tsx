import { cn, useBoolean } from '@/lib/utils'
import { useDebounce, useStorage } from '@extension/shared'
import { settingStorage } from '@extension/storage'
import { command, Stack, Text } from '@extension/ui'
import { commandResolverService } from '@src/service/command-resolver'
import type { CommandQueryParams, ICommandResultGroup } from '@src/service/command-resolver'
import { PLUGIN_LIST_NAME } from '@src/service/command-resolver/plugin'
import { useEffect, useRef, useState, type FC } from 'react'
import { t } from '@extension/i18n'

const CommandItemIcon: FC<{ iconUrl?: string; IconType?: React.ElementType }> = ({ iconUrl, IconType }) => {
  return (
    <div className="bg-muted-foreground/10 rounded-sm size-10 flex items-center justify-center shrink-0">
      {iconUrl && <img src={iconUrl} alt="icon" className="size-6 rounded-md mx-3" />}
      {IconType && <IconType className="stroke-2 mx-3" />}
    </div>
  )
}

export const CommandModule: FC<{
  className?: string
}> = ({ className }) => {
  const [focus, focusFunc] = useBoolean(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputVal, setInputVal] = useState('')
  const [result, setResult] = useState<ICommandResultGroup[]>([])
  const inputDelay = useDebounce(inputVal, 200)
  const [isWindows] = useState(() => {
    return navigator.userAgent.toLowerCase().includes('windows')
  })
  const keyBindings = isWindows ? 'Alt+K' : '⌘+K'

  useEffect(() => {
    const query: CommandQueryParams = {
      query: inputDelay, // Will be replaced by manager with stripped query
      rawQuery: inputDelay,
      changeQuery: (newQuery: string) => {
        setInputVal(newQuery)
      },
    }
    setResult([])
    commandResolverService.resolve(query, group => {
      setResult(prev => [...prev, group])
    })
  }, [inputDelay, setInputVal])

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
        placeholder={t('searchCommandPlaceholder')}
        className="h-14 md:h-12 text-lg md:text-base"
        keyBindings={keyBindings}
      />
      <command.CommandList
        className={cn('max-h-80', focus ? 'block' : 'hidden')}
        onMouseDown={e => {
          // Prevent the input from losing focus when clicking on items
          e.preventDefault()
        }}>
        <command.CommandEmpty>{t('noResultsFound')}</command.CommandEmpty>
        {result.map(val => {
          // Translate internal plugin names to user-friendly names
          const displayName = val.groupName === PLUGIN_LIST_NAME ? t('availablePlugins') : val.groupName
          return (
            <command.CommandGroup heading={displayName} key={val.groupName}>
              {val.result.length === 0 ? (
                <command.CommandItem disabled className="py-1.5 w-full opacity-60">
                  <Text level="xs" gray>
                    {t('noResultsForPlugin')}
                  </Text>
                </command.CommandItem>
              ) : (
                val.result.map(res => {
                  return (
                    <command.CommandItem
                      key={res.id}
                      value={res.id}
                      onSelect={() => {
                        res.onSelect?.()
                        // Hide the panel after selection
                        focusFunc.setFalse()
                        inputRef.current?.blur()
                      }}
                      className="p-2 w-full">
                      <Stack center className="gap-2">
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
                })
              )}
            </command.CommandGroup>
          )
        })}
      </command.CommandList>
    </command.Command>
  )
}

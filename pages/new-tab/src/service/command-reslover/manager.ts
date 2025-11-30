import type {
  ICommandReslover,
  ICommandResultGroup,
  CommandQueryParams,
  CommandSettings,
} from './plugin'

import {
  historyReslover, tabSearchReslover, webSearchReslover, calculatorResolver, numberToRmbReslover
} from './plugin'
import { WarpDefaultObject } from '@extension/shared'
import { commandSettingsStorage, defaultCommandSettings } from '@extension/storage'
import type { CommandSettingsData, CommandPluginSettings } from '@extension/storage'

export type IDisposable = {
  dispose: () => void
}

const defaultSettings: CommandSettings = {
  priority: 0,
  active: true,
  includeInGlobal: true,
  activeKey: '',
}

interface ICommandResloverWithSettings extends ICommandReslover {
  getSettings: () => CommandSettings
}

function createResolverWithSettings(
  resolver: ICommandReslover,
  getStorageSettings: () => CommandSettingsData | null,
): ICommandResloverWithSettings {
  return {
    ...resolver,
    getSettings(): CommandSettings {
      const storageSettings = getStorageSettings()
      const pluginStorageSettings = storageSettings?.[resolver.name]
      if (pluginStorageSettings) {
        return pluginStorageSettings
      }
      // Fallback to default command settings or plugin defaults
      const defaultPluginSettings = defaultCommandSettings[resolver.name]
      if (defaultPluginSettings) {
        return defaultPluginSettings
      }
      return WarpDefaultObject(resolver.settings, defaultSettings)
    },
    get settings(): CommandSettings {
      return this.getSettings()
    },
  }
}

class CommandResolverService {
  resolvers: ICommandResloverWithSettings[] = []
  _queryTimes = 0
  private _storageSettings: CommandSettingsData | null = null

  constructor() {
    this.initStorage()
  }

  private async initStorage() {
    // Get initial settings
    this._storageSettings = await commandSettingsStorage.get()
    
    // Subscribe to storage changes
    commandSettingsStorage.subscribe(() => {
      const snapshot = commandSettingsStorage.getSnapshot()
      if (snapshot) {
        this._storageSettings = snapshot
      }
    })
  }

  private getStorageSettings = (): CommandSettingsData | null => {
    return this._storageSettings
  }

  register(resolver: ICommandReslover) {
    this.resolvers.push(createResolverWithSettings(resolver, this.getStorageSettings))
    this.sortResolvers()
  }

  private sortResolvers() {
    this.resolvers.sort((a, b) => {
      return a.getSettings().priority - b.getSettings().priority
    })
  }

  choosePlugins(params: CommandQueryParams): ICommandResloverWithSettings[] {
    const availablePlugins = this.resolvers.filter(it => it.getSettings().active)
    const matchedPlugins = availablePlugins.filter(
      it => {
        const settings = it.getSettings()
        return settings.activeKey && params.query.startsWith(settings.activeKey)
      },
    )
    if (matchedPlugins.length > 0) return matchedPlugins
    return this.resolvers.filter(it => it.getSettings().includeInGlobal)
  }

  resolve(params: CommandQueryParams, onGroupResolve: (group: ICommandResultGroup) => void) {
    const _tick = ++this._queryTimes
    const warpOnGroupResolve = (group: ICommandResultGroup) => {
      if (_tick != this._queryTimes) {
        return
      }
      onGroupResolve(group)
    }
    
    // Sort resolvers before resolving (in case priorities changed)
    this.sortResolvers()
    
    Promise.all(
      this.resolvers
        .filter(it => {
          const settings = it.getSettings()
          return settings.active && settings.includeInGlobal
        })
        .map(it => {
          return new Promise((reslove, reject) => {
            it.resolve(params)
              .then(res => {
                if (res === null) {
                  reslove(null)
                  return
                }
                warpOnGroupResolve({
                  groupName: it.name,
                  result: res,
                })
                reslove(null)
              })
              .catch(err => reject(err))
          })
        }),
    )
  }
}

export const commandResolverService = new CommandResolverService()

commandResolverService.register(historyReslover)
commandResolverService.register(tabSearchReslover)
commandResolverService.register(webSearchReslover)
commandResolverService.register(calculatorResolver)
commandResolverService.register(numberToRmbReslover)

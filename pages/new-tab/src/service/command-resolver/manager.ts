import type { ICommandResolver, ICommandResultGroup, CommandQueryParams, CommandSettings } from './plugin'

import {
  historyResolver,
  tabSearchResolver,
  webSearchResolver,
  calculatorResolver,
  numberToRmbResolver,
  bookmarksResolver,
  quickLinksResolver,
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

interface ICommandResolverWithSettings extends ICommandResolver {
  getSettings: () => CommandSettings
}

function createResolverWithSettings(
  resolver: ICommandResolver,
  getStorageSettings: () => CommandSettingsData | null,
): ICommandResolverWithSettings {
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
  resolvers: ICommandResolverWithSettings[] = []
  _queryTimes = 0
  private _storageSettings: CommandSettingsData | null = null

  constructor() {
    // Try to get initial settings synchronously from snapshot
    this._storageSettings = commandSettingsStorage.getSnapshot()
    // Initialize async to ensure storage is properly loaded and subscribed to changes
    this.initStorage()
  }

  private async initStorage() {
    // Get initial settings if not already loaded from snapshot
    if (!this._storageSettings) {
      this._storageSettings = await commandSettingsStorage.get()
    }

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

  register(resolver: ICommandResolver) {
    this.resolvers.push(createResolverWithSettings(resolver, this.getStorageSettings))
    this.sortResolvers()
  }

  private sortResolvers() {
    this.resolvers.sort((a, b) => {
      return a.getSettings().priority - b.getSettings().priority
    })
  }

  choosePlugins(params: CommandQueryParams): ICommandResolverWithSettings[] {
    const availablePlugins = this.resolvers.filter(it => it.getSettings().active)
    const matchedPlugins = availablePlugins.filter(it => {
      const settings = it.getSettings()
      return settings.activeKey && params.query.startsWith(settings.activeKey)
    })
    if (matchedPlugins.length > 0) return matchedPlugins
    return this.resolvers.filter(it => {
      const settings = it.getSettings()
      return settings.active && settings.includeInGlobal
    })
  }

  resolve(params: CommandQueryParams, onGroupResolve: (group: ICommandResultGroup) => void) {
    const _tick = ++this._queryTimes
    const warpOnGroupResolve = (group: ICommandResultGroup) => {
      if (_tick !== this._queryTimes) {
        return
      }
      onGroupResolve(group)
    }

    // Sort resolvers before resolving (in case priorities changed)
    this.sortResolvers()

    Promise.all(
      this.choosePlugins(params).map(it => {
        return new Promise((resolve, reject) => {
          it.resolve(params)
            .then(res => {
              if (res === null) {
                resolve(null)
                return
              }
              warpOnGroupResolve({
                groupName: it.name,
                result: res,
              })
              resolve(null)
            })
            .catch(err => reject(err))
        })
      }),
    )
  }
}

export const commandResolverService = new CommandResolverService()

commandResolverService.register(historyResolver)
commandResolverService.register(tabSearchResolver)
commandResolverService.register(webSearchResolver)
commandResolverService.register(calculatorResolver)
commandResolverService.register(numberToRmbResolver)
commandResolverService.register(bookmarksResolver)
commandResolverService.register(quickLinksResolver)

import type { ICommandResolver, ICommandResultGroup, CommandQueryParams, CommandSettings } from './plugin'

import {
  historyResolver,
  tabSearchResolver,
  webSearchResolver,
  calculatorResolver,
  numberToRmbResolver,
  bookmarksResolver,
  pluginListResolver,
  PLUGIN_LIST_NAME,
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
      const pluginStorageSettings = storageSettings?.[resolver.properties.name]
      if (pluginStorageSettings) {
        return pluginStorageSettings
      }
      // Fallback to default command settings or plugin defaults
      const defaultPluginSettings = defaultCommandSettings[resolver.properties.name]
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

  /**
   * Strip the trigger key from the query for a specific plugin
   * Handles one space after the trigger key (e.g., "rmb 1233")
   * If multiple spaces exist, only remove the first one
   */
  private stripTriggerKeyForPlugin(rawQuery: string, plugin: ICommandResolverWithSettings): string {
    const settings = plugin.getSettings()
    const activeKey = settings.activeKey

    if (!activeKey || !rawQuery.startsWith(activeKey)) {
      return rawQuery
    }

    // Remove the activeKey
    let remaining = rawQuery.slice(activeKey.length)

    // If there's a space at the start, remove exactly one space
    if (remaining.startsWith(' ')) {
      remaining = remaining.slice(1)
    }

    return remaining
  }

  choosePlugins(rawQuery: string): ICommandResolverWithSettings[] {
    const availablePlugins = this.resolvers.filter(it => it.getSettings().active)

    // When query is empty, show plugin list
    if (rawQuery.length === 0) {
      const pluginListPlugin = this.resolvers.find(it => it.properties.name === PLUGIN_LIST_NAME)
      return pluginListPlugin ? [pluginListPlugin] : []
    }

    // Try to match plugins with activeKey
    const matchedPlugins = availablePlugins.filter(it => {
      const settings = it.getSettings()
      return settings.activeKey && rawQuery.startsWith(settings.activeKey)
    })

    if (matchedPlugins.length > 0) {
      return matchedPlugins
    }

    // Return global plugins
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

    // Choose plugins based on raw query
    const plugins = this.choosePlugins(params.rawQuery)

    // Pass resolver service to plugins so they can access other plugins
    const extendedParams = { ...params, resolverService: this }

    Promise.all(
      plugins.map(it => {
        return new Promise((resolve, reject) => {
          // Strip trigger key for this specific plugin
          const strippedQuery = this.stripTriggerKeyForPlugin(params.rawQuery, it)
          
          // Create params with stripped query for this plugin
          const pluginParams: CommandQueryParams = {
            query: strippedQuery,
            rawQuery: params.rawQuery,
            changeQuery: params.changeQuery,
          }
          
          // Merge with resolver service
          const pluginExtendedParams = { ...pluginParams, resolverService: this }

          it.resolve(pluginExtendedParams)
            .then(res => {
              if (res === null || res.length === 0) {
                // If plugin returns null or empty array, still show empty group for non-empty queries
                // This helps users know the plugin was invoked but found nothing
                if (strippedQuery.length > 0) {
                  warpOnGroupResolve({
                    groupName: it.properties.name,
                    result: [],
                  })
                }
                resolve(null)
                return
              }
              warpOnGroupResolve({
                groupName: it.properties.name,
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

commandResolverService.register(pluginListResolver)
commandResolverService.register(historyResolver)
commandResolverService.register(tabSearchResolver)
commandResolverService.register(webSearchResolver)
commandResolverService.register(calculatorResolver)
commandResolverService.register(numberToRmbResolver)
commandResolverService.register(bookmarksResolver)

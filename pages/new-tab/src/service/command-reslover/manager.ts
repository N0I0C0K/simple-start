import type {
  ICommandReslover,
  ICommandResultGroup,
  CommandQueryParams,
  CommandSettings,
} from './plugin'

import {
  historyReslover, tabSearchReslover, webSearchReslover
} from './plugin'
import { WarpDefaultObject } from '@extension/shared'

export type IDisposable = {
  dispose: () => void
}

const defaultSettings: CommandSettings = {
  priority: 0,
  active: true,
  includeInGlobal: true,
  activeKey: '',
}

interface ICommandResloverWithDefaultSettings extends ICommandReslover {
  settings: CommandSettings
}

function WarpDefaultSetting(resolver: ICommandReslover): ICommandResloverWithDefaultSettings {
  return {
    ...resolver,
    settings: WarpDefaultObject(resolver.settings, defaultSettings)
  }
}

export const commandResolverService = {
  resolvers: [] as ICommandResloverWithDefaultSettings[],
  _queryTimes: 0 as number,
  register(resolver: ICommandReslover) {
    this.resolvers.push(WarpDefaultSetting(resolver))
    this.resolvers.sort((a, b) => {
      return a.settings.priority - b.settings.priority
    })
  },
  choosePlugins(params: CommandQueryParams): ICommandReslover[] {
    const availablePlugins = this.resolvers.filter(it => it.settings.active)
    const matchedPlugins = availablePlugins.filter(
      it => it.settings.activeKey && params.query.startsWith(it.settings.activeKey),
    )
    if (matchedPlugins.length > 0) return matchedPlugins
    return this.resolvers.filter(it => it.settings.includeInGlobal)
  },
  resolve(params: CommandQueryParams, onGroupResolve: (group: ICommandResultGroup) => void) {
    const _tick = ++this._queryTimes
    const warpOnGroupResolve = (group: ICommandResultGroup) => {
      if (_tick != this._queryTimes) {
        return
      }
      onGroupResolve(group)
    }
    Promise.all(
      this.resolvers
        .filter(it => it.settings.active && it.settings.includeInGlobal)
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
  },
}

commandResolverService.register(historyReslover)
commandResolverService.register(tabSearchReslover)
commandResolverService.register(webSearchReslover)
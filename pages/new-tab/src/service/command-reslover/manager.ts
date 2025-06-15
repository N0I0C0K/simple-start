import type {
  ICommandReslover,
  ICommandResultGroup,
  ICommandResult,
  CommandQueryParams,
  CommandSettings,
} from './plugin'

export type IDisposable = {
  dispose: () => void
}

const defaultSettings: CommandSettings = {
  priority: 0,
  active: true,
  includeInGlobal: false,
}

export const commandResolverService = {
  resolvers: [] as ICommandReslover[],
  _queryTimes: 0 as number,
  register(resolver: ICommandReslover) {
    this.resolvers.push(resolver)
    this.resolvers.sort((a, b) => {
      return (a.settings.priority ?? 0) - (b.settings.priority ?? 0)
    })
  },
  choosePlugin(params: CommandQueryParams): ICommandReslover | undefined {
    return this.resolvers.find(
      it => it.settings.activeKey && it.settings.active && params.query.startsWith(it.settings.activeKey),
    )
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

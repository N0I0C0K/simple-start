export type CommandQueryParams = {
  query: string
}

export interface ICommandResultGroup {
  groupName: string
  result: ICommandResult[]
}

export interface ICommandResult {
  id: string
  title: string
  description?: string
  iconUrl?: string
  IconType?: React.ElementType
  onSelect?: () => void
}

interface _CommandSettings {
  priority: number
  active: boolean
  activeKey: string
  includeInGlobal: boolean
}

export type CommandSettings = Partial<_CommandSettings>

export interface CommandProperties {
  label?: string
}

export interface ICommandReslover {
  name: string
  properties: CommandProperties
  settings: CommandSettings
  resolve: (params: CommandQueryParams) => Promise<ICommandResult[] | null>
}

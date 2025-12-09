export type CommandQueryParams = {
  query: string
  changeQuery?: (newQuery: string) => void
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

export interface CommandSettings {
  priority: number // The lower the number, the higher the priority
  active: boolean
  activeKey: string
  includeInGlobal: boolean
}

export type PartialCommandSettings = Partial<CommandSettings>

export interface CommandProperties {
  label?: string
  name: string
  description?: string
}

export interface ICommandResolver {
  properties: CommandProperties
  settings: PartialCommandSettings
  resolve: (params: CommandQueryParams) => Promise<ICommandResult[] | null>
}

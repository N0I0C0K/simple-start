import type { ICommandResolver, ICommandResult, CommandQueryParams, CommandSettings } from './protocol'
import { Layers } from 'lucide-react'
import { t } from '@extension/i18n'

/**
 * Internal plugin that shows all available plugins when input is empty
 * This helps users discover what plugins are available and their trigger keys
 */
export const PLUGIN_LIST_NAME = '__internal_plugin_list__'

// Internal interface for resolver with settings (matches ICommandResolverWithSettings from manager.ts)
interface ICommandResolverWithSettings extends ICommandResolver {
  getSettings: () => CommandSettings
}

// Extended params interface for internal use with resolver service
interface ExtendedCommandQueryParams extends CommandQueryParams {
  resolverService?: {
    resolvers: ICommandResolverWithSettings[]
  }
}

export const pluginListResolver: ICommandResolver = {
  name: PLUGIN_LIST_NAME,
  settings: {
    priority: -1000, // Highest priority to ensure it appears first
    active: true,
    includeInGlobal: false, // Only show when explicitly empty, not in global search
    activeKey: '',
  },
  properties: {
    label: 'Plugin List',
  },
  resolve: async params => {
    // Only show when query is completely empty
    if (params.query.length !== 0) return null

    // Get all registered plugins from the service
    // This will be populated by passing the resolver service as context
    const extendedParams = params as ExtendedCommandQueryParams
    const { resolverService } = extendedParams

    if (!resolverService) return null

    const results: ICommandResult[] = []
    
    // Get all active plugins
    const activePlugins = resolverService.resolvers.filter(r => {
      const settings = r.getSettings()
      return settings.active
    })

    // Create result items for each plugin
    for (const plugin of activePlugins) {
      const settings = plugin.getSettings()
      const triggerKey = settings.activeKey
      
      // Skip the plugin-list itself
      if (plugin.name === PLUGIN_LIST_NAME) continue

      results.push({
        id: `plugin-list-${plugin.name}`,
        title: plugin.name,
        description: triggerKey 
          ? `${t('commandPluginActiveKey')}: ${triggerKey}` 
          : t('availablePluginsDescription'),
        IconType: Layers,
        onSelect: () => {
          // Do nothing on select - this is just informational
        },
      })
    }

    return results
  },
}

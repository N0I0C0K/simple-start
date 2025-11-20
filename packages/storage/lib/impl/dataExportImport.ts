/**
 * Data export/import functionality for user settings and data
 */

import type { QuickUrlItem } from '../base/types'
import type { SettingProps } from './settingsStorage'

// Import types from existing implementations
type Theme = 'light' | 'dark' | 'system'

export interface ExportedData {
  version: string
  exportDate: string
  theme?: Theme
  settings: SettingProps
  quickUrls: QuickUrlItem[]
}

/**
 * Export all user data as JSON and download it
 */
export async function exportAllData(): Promise<void> {
  const { settingStorage } = await import('./settingsStorage')
  const { quickUrlItemsStorage } = await import('./quickUrlStorage')
  const { exampleThemeStorage } = await import('./exampleThemeStorage')
  
  const settings = await settingStorage.get()
  const quickUrls = await quickUrlItemsStorage.get()
  const theme = await exampleThemeStorage.get()
  
  const exportData: ExportedData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    theme,
    settings,
    quickUrls,
  }
  
  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `simple-start-settings-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import all user data from a JSON file
 */
export async function importAllData(file: File): Promise<void> {
  const data = await parseAndValidateImportFile(file)
  
  const { settingStorage } = await import('./settingsStorage')
  const { quickUrlItemsStorage } = await import('./quickUrlStorage')
  const { exampleThemeStorage } = await import('./exampleThemeStorage')
  
  // Import settings
  await settingStorage.set(data.settings)
  
  // Import quick URLs
  await quickUrlItemsStorage.set(data.quickUrls)
  
  // Import theme if present
  if (data.theme) {
    await exampleThemeStorage.set(data.theme)
  }
}

/**
 * Parse and validate the imported JSON file
 */
function parseAndValidateImportFile(file: File): Promise<ExportedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as ExportedData
        
        // Validate the imported data structure
        if (!data.settings || !data.quickUrls || !Array.isArray(data.quickUrls)) {
          throw new Error('Invalid data format: missing required fields (settings or quickUrls)')
        }
        
        // Validate settings structure
        if (typeof data.settings.useHistorySuggestion !== 'boolean' ||
            typeof data.settings.autoFocusCommandInput !== 'boolean' ||
            !data.settings.mqttSettings) {
          throw new Error('Invalid settings format')
        }
        
        // Validate quick URLs
        for (const item of data.quickUrls) {
          if (!item.id || !item.title || !item.url) {
            throw new Error('Invalid quick URL item: missing required fields')
          }
        }
        
        resolve(data)
      } catch (error) {
        reject(new Error('Failed to parse JSON file: ' + (error as Error).message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

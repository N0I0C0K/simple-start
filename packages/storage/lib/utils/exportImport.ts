/**
 * Utility functions for exporting and importing settings
 */

import type { QuickUrlItem } from '../base/types'

export interface ExportedData {
  version: string
  exportDate: string
  theme?: 'light' | 'dark' | 'system'
  settings: {
    useHistorySuggestion: boolean
    autoFocusCommandInput: boolean
    wallpaperUrl: string | null
    mqttSettings: {
      mqttBrokerUrl: string
      secretKey: string
      enabled: boolean
      username: string
    }
  }
  quickUrls: QuickUrlItem[]
}

/**
 * Export data as JSON and download it
 */
export function exportDataAsJSON(data: ExportedData): void {
  const jsonString = JSON.stringify(data, null, 2)
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
 * Import data from a JSON file
 */
export function importDataFromJSON(file: File): Promise<ExportedData> {
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

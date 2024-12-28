import { createRoot } from 'react-dom/client'
import '@src/index.css'
//import '@extension/ui/lib/global.css'
import { exampleThemeStorage, getThemeFromLocal } from '@extension/storage'
import { useStorage } from '@extension/shared'
import { TooltipProvider, ThemeProvider } from '@extension/ui'
import NewTab from './NewTab'
import { GlobalDialog } from '@src/components/GlobalDialog'
function App() {
  const theme = useStorage(exampleThemeStorage)

  return (
    <div>
      <GlobalDialog>
        <NewTab />
      </GlobalDialog>
    </div>
  )
}

exampleThemeStorage.subscribe(() => {
  exampleThemeStorage.get().then(val => {
    localStorage.setItem('theme-storage-key-local', val)
  })
})

function getThemeFromLocal() {
  return localStorage.getItem('theme-storage-key-local') ?? 'system'
}

function init() {
  const appContainer = document.querySelector('#app-container')
  if (!appContainer) {
    throw new Error('Can not find #app-container')
  }
  const root = createRoot(appContainer)
  const rootElement = window.document.documentElement

  const theme = getThemeFromLocal()
  rootElement.classList.remove('light', 'dark')
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    rootElement.classList.add(systemTheme)
    return
  }

  rootElement.classList.add(theme)

  root.render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  )
}

init()

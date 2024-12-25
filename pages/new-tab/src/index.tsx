import { createRoot } from 'react-dom/client'
import '@src/index.css'
//import '@extension/ui/lib/global.css'
import { exampleThemeStorage } from '@extension/storage'
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

async function init() {
  const appContainer = document.querySelector('#app-container')
  if (!appContainer) {
    throw new Error('Can not find #app-container')
  }
  const root = createRoot(appContainer)
  const rootElement = window.document.documentElement
  //rootElement.classList.add('dark')

  const theme = await exampleThemeStorage.get()
  rootElement.classList.remove('light', 'dark')
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    rootElement.classList.add(systemTheme)
    return
  }

  rootElement.classList.add(theme)
  // .then(theme => {

  // })
  root.render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  )
}

init()

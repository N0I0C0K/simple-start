import { createRoot } from 'react-dom/client'
import '@src/index.css'
//import '@extension/ui/lib/global.css'
import { exampleThemeStorage } from '@extension/storage'
import { useStorage } from '@extension/shared'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const theme = useStorage(exampleThemeStorage)

  return (
    <div>
      <Button className="size-100">12121</Button>
    </div>
  )
}

function init() {
  const appContainer = document.querySelector('#app-container')
  if (!appContainer) {
    throw new Error('Can not find #app-container')
  }
  const root = createRoot(appContainer)

  root.render(<App />)
}

init()

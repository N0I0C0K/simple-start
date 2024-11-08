import '@src/NewTab.css'
import { useStorage } from '@extension/shared'
import { exampleThemeStorage } from '@extension/storage'
import { Button } from '@ui/button'

const NewTab = () => {
  const theme = useStorage(exampleThemeStorage)
  const isLight = theme === 'light'

  return (
    <div
      className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'} flex h-screen w-screen max-w-[100vw] flex-row items-center`}>
      <Button>Tog me</Button>
    </div>
  )
}

export default NewTab

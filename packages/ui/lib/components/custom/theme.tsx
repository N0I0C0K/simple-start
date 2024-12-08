import { Moon, Sun } from 'lucide-react'

//import { Button } from '@/components/ui/button'

import { useTheme } from '../provider/theme'
import type { FC } from 'react'
import { Stack } from './stack'
import { Switch } from '../ui/switch'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu'
import { Button } from '../ui/button'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const ThemeSwitch: FC<{
  className?: string
}> = ({ className }) => {
  const { theme, setTheme } = useTheme()
  return (
    <Stack direction={'row'} className={className} center>
      <Stack direction={'row'} className="mr-2">
        <Sun className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Stack>
      <Switch
        onCheckedChange={checked => {
          setTheme(checked ? 'dark' : 'light')
        }}
        checked={theme === 'dark'}
      />
    </Stack>
  )
}

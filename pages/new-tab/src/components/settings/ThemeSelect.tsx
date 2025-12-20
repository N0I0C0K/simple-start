import type { FC } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@extension/ui'

export const ThemeSelect: FC = () => {
  return (
    <Select>
      <SelectTrigger></SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">dark</SelectItem>
      </SelectContent>
    </Select>
  )
}

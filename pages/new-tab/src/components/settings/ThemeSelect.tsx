import { FC } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@extension/ui'

const ThemeSelect: FC = () => {
  return (
    <Select>
      <SelectTrigger></SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">dark</SelectItem>
      </SelectContent>
    </Select>
  )
}

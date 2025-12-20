import { Stack, Text, toast } from '@extension/ui'

interface LinkCardTooltipContentProps {
  title: string
  url: string
}

/**
 * LinkCardTooltipContent - The tooltip content showing title and URL
 */
export const LinkCardTooltipContent = ({ title, url }: LinkCardTooltipContentProps) => {
  return (
    <Stack direction={'column'}>
      <Text>{title}</Text>
      <Text
        level="s"
        gray
        className="cursor-pointer"
        onClick={() => {
          toast.success('Copy success', { description: url })
        }}>
        {url}
      </Text>
    </Stack>
  )
}

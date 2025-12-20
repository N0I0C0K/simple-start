import { Stack, Text, toast } from '@extension/ui'

interface LinkCardTooltipContentProps {
  title: string
  url: string
  id: string
}

/**
 * LinkCardTooltipContent - The tooltip content showing title and URL
 */
export const LinkCardTooltipContent = ({ title, url, id }: LinkCardTooltipContentProps) => {
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Copy success', { description: url })
    } catch {
      // Fallback: just show the URL in toast even if copy failed
      toast.success('URL', { description: url })
    }
  }

  return (
    <Stack direction={'column'}>
      <Text>{title}</Text>
      <Text level="s" gray className="cursor-pointer" onClick={handleCopyClick}>
        {url}
      </Text>
      <Text level="xs" gray>
        {id}
      </Text>
    </Stack>
  )
}

LinkCardTooltipContent.displayName = 'LinkCardTooltipContent'

import { Button, Stack, Text } from '@extension/ui'
import { Info, ExternalLink, MessageSquareWarning, RefreshCw } from 'lucide-react'
import type { FC , ElementType, ReactElement } from 'react'
import { t } from '@extension/i18n'
import { cn } from '@/lib/utils'
import type { LucideProps } from 'lucide-react'

const AboutItem: FC<{
  className?: string
  title: string
  description?: string
  control: ReactElement
  IconClass: ElementType<LucideProps>
}> = ({ control, title, className, description, IconClass }) => {
  return (
    <Stack
      direction={'row'}
      className={cn(
        'items-center overflow-hidden relative rounded-md p-3 border-slate-400/20',
        'bg-muted gap-2',
        className,
      )}>
      <IconClass className="min-w-8 size-8 text-muted-foreground" />
      <Stack direction={'column'} className="gap-0.5">
        <Text className="font-medium" level="md">
          {title}
        </Text>
        <Text gray className="-mt-1 max-w-[20em]" level="s">
          {description}
        </Text>
      </Stack>
      <div className="ml-auto">{control}</div>
    </Stack>
  )
}

export const AboutSettings: FC = () => {
  const version = chrome.runtime.getManifest().version
  const repositoryUrl = 'https://github.com/N0I0C0K/NextTab'
  const issuesUrl = `${repositoryUrl}/issues/new`
  const releasesUrl = `${repositoryUrl}/releases`

  const openUrl = (url: string) => {
    chrome.tabs.create({ url })
  }

  return (
    <Stack direction={'column'} className={'gap-2 w-full'}>
      <Text gray level="s">
        {t('aboutDescription')}
      </Text>
      <AboutItem
        IconClass={Info}
        title={t('version')}
        description={version}
        control={<Text className="font-mono text-muted-foreground">{version}</Text>}
      />
      <AboutItem
        IconClass={ExternalLink}
        title={t('repository')}
        description={repositoryUrl}
        control={
          <Button variant={'outline'} onClick={() => openUrl(repositoryUrl)}>
            {t('viewOnGithub')}
          </Button>
        }
      />
      <AboutItem
        IconClass={MessageSquareWarning}
        title={t('reportIssue')}
        description={t('reportIssueDescription')}
        control={
          <Button variant={'outline'} onClick={() => openUrl(issuesUrl)}>
            {t('reportIssue')}
          </Button>
        }
      />
      <AboutItem
        IconClass={RefreshCw}
        title={t('updates')}
        description={t('checkForUpdatesDescription')}
        control={
          <Button variant={'outline'} onClick={() => openUrl(releasesUrl)}>
            {t('checkForUpdates')}
          </Button>
        }
      />
    </Stack>
  )
}

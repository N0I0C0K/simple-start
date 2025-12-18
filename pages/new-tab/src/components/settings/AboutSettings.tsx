import { Button, Stack, Text } from '@extension/ui'
import { Info, ExternalLink, MessageSquareWarning, RefreshCw } from 'lucide-react'
import type { FC } from 'react'
import { t } from '@extension/i18n'
import { SettingItem } from '../setting-pannel'
import packageJson from '../../../../../package.json'

export const AboutSettings: FC = () => {
  const version = chrome.runtime.getManifest().version
  const repositoryUrl = packageJson.repository?.url || 'https://github.com/N0I0C0K/NextTab'
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
      <SettingItem
        IconClass={Info}
        title={t('version')}
        description={t('versionDescription')}
        control={<Text className="font-mono text-muted-foreground">{version}</Text>}
      />
      <SettingItem
        IconClass={ExternalLink}
        title={t('repository')}
        description={t('repositoryDescription')}
        control={
          <Button variant={'outline'} onClick={() => openUrl(repositoryUrl)}>
            {t('viewOnGithub')}
          </Button>
        }
      />
      <SettingItem
        IconClass={MessageSquareWarning}
        title={t('reportIssue')}
        description={t('reportIssueDescription')}
        control={
          <Button variant={'outline'} onClick={() => openUrl(issuesUrl)}>
            {t('reportIssue')}
          </Button>
        }
      />
      <SettingItem
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

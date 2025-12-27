import { Button, Stack, Text } from '@extension/ui'
import { Info, ExternalLink, MessageSquareWarning, RefreshCw } from 'lucide-react'
import type { FC } from 'react'
import { t } from '@extension/i18n'
import { SettingItem } from '../setting-pannel'
import packageJson from '../../../../../package.json'
import { useLatestVersion } from '@src/hooks/useLatestVersion'
import { isUpdateAvailable } from '@src/utils/semver'

const useAboutUrls = () => {
  const repositoryUrl = packageJson.repository?.url || 'https://github.com/N0I0C0K/NextTab'
  return {
    repositoryUrl,
    issuesUrl: `${repositoryUrl}/issues/new`,
    releasesUrl: `${repositoryUrl}/releases`
  }
}

const useVersionStatus = (currentVersion: string, latestVersion: string, isChecking: boolean, checkError: boolean) => {
  const hasUpdate = latestVersion && !checkError && isUpdateAvailable(currentVersion, latestVersion)

  const getLatestVersionDisplay = () => {
    if (isChecking) return t('checkingForUpdates')
    if (checkError) return t('failedToCheckUpdates')
    if (!latestVersion) return '-'
    return latestVersion
  }

  const getUpdateStatus = () => {
    if (isChecking || checkError || !latestVersion) return null
    return hasUpdate ? t('updateAvailable') : t('upToDate')
  }

  return { hasUpdate, getLatestVersionDisplay, getUpdateStatus }
}

export const AboutSettings: FC = () => {
  const version = chrome.runtime.getManifest().version
  const { repositoryUrl, issuesUrl, releasesUrl } = useAboutUrls()
  const { latestVersion, isChecking, checkError } = useLatestVersion(repositoryUrl)
  const { hasUpdate, getLatestVersionDisplay, getUpdateStatus } = useVersionStatus(
    version,
    latestVersion,
    isChecking,
    checkError
  )

  const openUrl = (url: string) => chrome.tabs.create({ url })

  const versionAdditionalControl = (
    <Stack direction={'row'} center className="absolute bottom-0 end-1 gap-1">
      <Text gray level="xs">
        {t('latestVersion')}:
      </Text>
      <Text level="xs" className="font-mono">
        {getLatestVersionDisplay()}
      </Text>
      {getUpdateStatus() && (
        <Text level="xs" className={hasUpdate ? 'text-yellow-500' : 'text-green-500'}>
          · {getUpdateStatus()}
        </Text>
      )}
    </Stack>
  )

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
        additionalControl={versionAdditionalControl}
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

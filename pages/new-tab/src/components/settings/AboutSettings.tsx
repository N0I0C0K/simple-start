import { Button, Stack, Text } from '@extension/ui'
import { Info, ExternalLink, MessageSquareWarning, RefreshCw } from 'lucide-react'
import { type FC, useState, useEffect } from 'react'
import { t } from '@extension/i18n'
import { SettingItem } from '../setting-pannel'
import packageJson from '../../../../../package.json'

interface GitHubRelease {
  tag_name: string
  name: string
}

export const AboutSettings: FC = () => {
  const version = chrome.runtime.getManifest().version
  const repositoryUrl = packageJson.repository?.url || 'https://github.com/N0I0C0K/NextTab'
  const issuesUrl = `${repositoryUrl}/issues/new`
  const releasesUrl = `${repositoryUrl}/releases`
  
  const [latestVersion, setLatestVersion] = useState<string>('')
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [checkError, setCheckError] = useState<boolean>(false)

  const openUrl = (url: string) => {
    chrome.tabs.create({ url })
  }
  
  const fetchLatestVersion = async () => {
    setIsChecking(true)
    setCheckError(false)
    try {
      const response = await fetch('https://api.github.com/repos/N0I0C0K/NextTab/releases/latest')
      if (!response.ok) {
        throw new Error('Failed to fetch')
      }
      const data: GitHubRelease = await response.json()
      // Use tag_name if name is empty, otherwise use name
      const versionText = data.name || data.tag_name
      setLatestVersion(versionText)
    } catch (error) {
      console.error('Failed to fetch latest version:', error)
      setCheckError(true)
    } finally {
      setIsChecking(false)
    }
  }
  
  useEffect(() => {
    fetchLatestVersion()
  }, [])
  
  const compareVersions = (current: string, latest: string): boolean => {
    // Simple version comparison - returns true if update is available
    const cleanCurrent = current.replace(/^v/, '')
    const cleanLatest = latest.replace(/^v/, '')
    return cleanCurrent !== cleanLatest
  }
  
  const hasUpdate = latestVersion && !checkError && compareVersions(version, latestVersion)
  
  const getLatestVersionDisplay = () => {
    if (isChecking) {
      return t('checkingForUpdates')
    }
    if (checkError) {
      return t('failedToCheckUpdates')
    }
    if (!latestVersion) {
      return '-'
    }
    return latestVersion
  }
  
  const getUpdateStatus = () => {
    if (isChecking || checkError || !latestVersion) {
      return null
    }
    return hasUpdate ? t('updateAvailable') : t('upToDate')
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
        IconClass={RefreshCw}
        title={t('latestVersion')}
        description={t('latestVersionDescription')}
        control={
          <Stack direction={'column'} className="items-end gap-0.5">
            <Text className="font-mono text-muted-foreground">{getLatestVersionDisplay()}</Text>
            {getUpdateStatus() && (
              <Text 
                level="xs" 
                className={hasUpdate ? 'text-yellow-500' : 'text-green-500'}
              >
                {getUpdateStatus()}
              </Text>
            )}
          </Stack>
        }
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

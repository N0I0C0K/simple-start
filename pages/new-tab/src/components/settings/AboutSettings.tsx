import { Button, Stack, Text } from '@extension/ui'
import { Info, ExternalLink, MessageSquareWarning, RefreshCw } from 'lucide-react'
import { type FC, useState, useEffect, useCallback } from 'react'
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
  
  const fetchLatestVersion = useCallback(async () => {
    setIsChecking(true)
    setCheckError(false)
    try {
      // Extract owner and repo from repository URL, handling .git suffix
      const repoMatch = repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/)
      if (!repoMatch) {
        throw new Error('Invalid repository URL')
      }
      const [, owner, repo] = repoMatch
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`)
      if (!response.ok) {
        throw new Error('Failed to fetch')
      }
      const data: GitHubRelease = await response.json()
      // Use name if available, otherwise use tag_name
      const versionText = data.name || data.tag_name
      setLatestVersion(versionText)
    } catch (error) {
      console.error('Failed to fetch latest version:', error)
      setCheckError(true)
    } finally {
      setIsChecking(false)
    }
  }, [repositoryUrl])
  
  useEffect(() => {
    fetchLatestVersion()
  }, [fetchLatestVersion])
  
  const compareVersions = (current: string, latest: string): boolean => {
    // Remove 'v' prefix if present
    const cleanCurrent = current.replace(/^v/, '').trim()
    const cleanLatest = latest.replace(/^v/, '').trim()
    
    // Parse semantic version numbers (only split on dots, ignore pre-release identifiers)
    const parseParts = (version: string) => {
      // Split on dots and take only numeric parts before any hyphen (pre-release)
      const mainVersion = version.split('-')[0]
      const parts = mainVersion.split('.').map(p => parseInt(p, 10))
      return parts.filter(p => !isNaN(p))
    }
    
    const currentParts = parseParts(cleanCurrent)
    const latestParts = parseParts(cleanLatest)
    
    // Compare version parts
    const maxLength = Math.max(currentParts.length, latestParts.length)
    for (let i = 0; i < maxLength; i++) {
      const currentPart = currentParts[i] || 0
      const latestPart = latestParts[i] || 0
      
      if (latestPart > currentPart) {
        return true // Update available
      }
      if (latestPart < currentPart) {
        return false // Current is newer
      }
    }
    
    // Versions are equal
    return false
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

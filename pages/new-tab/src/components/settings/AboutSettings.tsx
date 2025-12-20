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

interface CachedVersion {
  version: string
  timestamp: number
}

const CACHE_KEY = 'latest_version_cache'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export const AboutSettings: FC = () => {
  const version = chrome.runtime.getManifest().version
  const repositoryUrl = packageJson.repository?.url || 'https://github.com/N0I0C0K/NextTab'
  const issuesUrl = `${repositoryUrl}/issues/new`
  const releasesUrl = `${repositoryUrl}/releases`
  
  const [latestVersion, setLatestVersion] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [checkError, setCheckError] = useState(false)

  const openUrl = (url: string) => {
    chrome.tabs.create({ url })
  }
  
  const fetchLatestVersion = useCallback(async () => {
    // Check if URL contains github.com
    if (!repositoryUrl.includes('github.com')) {
      console.warn('Repository URL is not a GitHub URL, skipping version check')
      setCheckError(true)
      return
    }

    // Check cache first
    try {
      const cached = await chrome.storage.local.get(CACHE_KEY)
      if (cached[CACHE_KEY]) {
        const cachedData: CachedVersion = cached[CACHE_KEY]
        const now = Date.now()
        if (now - cachedData.timestamp < CACHE_DURATION) {
          setLatestVersion(cachedData.version)
          return
        }
      }
    } catch (error) {
      console.error('Failed to read cache:', error)
    }

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

      // Cache the result
      try {
        await chrome.storage.local.set({
          [CACHE_KEY]: {
            version: versionText,
            timestamp: Date.now()
          } as CachedVersion
        })
      } catch (error) {
        console.error('Failed to cache version:', error)
      }
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
    // Normalize versions (remove leading 'v', trim)
    const cleanCurrent = current.replace(/^v/, '').trim()
    const cleanLatest = latest.replace(/^v/, '').trim()

    type SemverPart = number | string
    interface Semver {
      major: number
      minor: number
      patch: number
      prerelease: SemverPart[]
    }

    const parseSemver = (version: string): Semver | null => {
      const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?$/.exec(version)
      if (!match) {
        return null
      }

      const [, majorStr, minorStr, patchStr, prereleaseStr] = match
      const major = parseInt(majorStr, 10)
      const minor = parseInt(minorStr, 10)
      const patch = parseInt(patchStr, 10)

      const prerelease: SemverPart[] = prereleaseStr
        ? prereleaseStr.split('.').map(part => {
            const num = Number(part)
            return Number.isNaN(num) ? part : num
          })
        : []

      return { major, minor, patch, prerelease }
    }

    const currentSemver = parseSemver(cleanCurrent)
    const latestSemver = parseSemver(cleanLatest)

    // Fallback to simple numeric comparison if parsing fails
    if (!currentSemver || !latestSemver) {
      const parseParts = (version: string) => {
        const mainVersion = version.split('-')[0]
        const parts = mainVersion.split('.').map(p => parseInt(p, 10))
        return parts.filter(p => !isNaN(p))
      }

      const currentParts = parseParts(cleanCurrent)
      const latestParts = parseParts(cleanLatest)

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
      return false
    }

    // Compare major, minor, patch
    if (latestSemver.major !== currentSemver.major) {
      return latestSemver.major > currentSemver.major
    }
    if (latestSemver.minor !== currentSemver.minor) {
      return latestSemver.minor > currentSemver.minor
    }
    if (latestSemver.patch !== currentSemver.patch) {
      return latestSemver.patch > currentSemver.patch
    }

    const currentPre = currentSemver.prerelease
    const latestPre = latestSemver.prerelease

    // If both have no prerelease, versions are equal
    if (currentPre.length === 0 && latestPre.length === 0) {
      return false
    }

    // A version without prerelease is greater than one with prerelease
    if (currentPre.length === 0 && latestPre.length > 0) {
      // latest is a pre-release of the same version -> not newer than current stable
      return false
    }
    if (currentPre.length > 0 && latestPre.length === 0) {
      // latest is stable while current is pre-release -> update available
      return true
    }

    // Both have prerelease identifiers: compare according to semver rules
    const maxPreLength = Math.max(currentPre.length, latestPre.length)
    for (let i = 0; i < maxPreLength; i++) {
      const curId = currentPre[i]
      const latId = latestPre[i]

      if (curId === undefined && latId !== undefined) {
        // current ran out of identifiers -> has lower precedence
        return true
      }
      if (curId !== undefined && latId === undefined) {
        // latest ran out of identifiers -> has lower precedence
        return false
      }
      if (curId === latId) {
        continue
      }

      const curIsNum = typeof curId === 'number'
      const latIsNum = typeof latId === 'number'

      if (curIsNum && latIsNum) {
        return (latId as number) > (curId as number)
      }

      // Numeric identifiers always have lower precedence than non-numeric
      if (curIsNum && !latIsNum) {
        return true
      }
      if (!curIsNum && latIsNum) {
        return false
      }

      // Both are strings: lexical comparison
      return String(latId).localeCompare(String(curId)) > 0
    }

    // All parts equal
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
        additionalControl={
          <Stack direction={'row'} center className="absolute bottom-0 end-1 gap-1">
            <Text gray level="xs">
              {t('latestVersion')}:
            </Text>
            <Text level="xs" className="font-mono">
              {getLatestVersionDisplay()}
            </Text>
            {getUpdateStatus() && (
              <Text 
                level="xs" 
                className={hasUpdate ? 'text-yellow-500' : 'text-green-500'}
              >
                · {getUpdateStatus()}
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

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

const comparePrerelease = (currentPre: SemverPart[], latestPre: SemverPart[]): number => {
  const maxPreLength = Math.max(currentPre.length, latestPre.length)
  for (let i = 0; i < maxPreLength; i++) {
    const curId = currentPre[i]
    const latId = latestPre[i]

    if (curId === undefined && latId !== undefined) {
      return -1 // current has lower precedence
    }
    if (curId !== undefined && latId === undefined) {
      return 1 // latest has lower precedence
    }
    if (curId === latId) {
      continue
    }

    const curIsNum = typeof curId === 'number'
    const latIsNum = typeof latId === 'number'

    if (curIsNum && latIsNum) {
      return (latId as number) - (curId as number)
    }

    // Numeric identifiers always have lower precedence than non-numeric
    if (curIsNum && !latIsNum) {
      return -1
    }
    if (!curIsNum && latIsNum) {
      return 1
    }

    // Both are strings: lexical comparison
    return String(latId).localeCompare(String(curId))
  }

  return 0 // All parts equal
}

const fallbackCompare = (current: string, latest: string): boolean => {
  const parseParts = (version: string) => {
    const mainVersion = version.split('-')[0]
    const parts = mainVersion.split('.').map(p => parseInt(p, 10))
    return parts.filter(p => !isNaN(p))
  }

  const currentParts = parseParts(current)
  const latestParts = parseParts(latest)

  const maxLength = Math.max(currentParts.length, latestParts.length)
  for (let i = 0; i < maxLength; i++) {
    const currentPart = currentParts[i] || 0
    const latestPart = latestParts[i] || 0

    if (latestPart > currentPart) {
      return true
    }
    if (latestPart < currentPart) {
      return false
    }
  }
  return false
}

/**
 * Compare two semantic versions to determine if an update is available
 * @param current - Current version string
 * @param latest - Latest version string
 * @returns true if latest version is newer than current, false otherwise
 */
export const isUpdateAvailable = (current: string, latest: string): boolean => {
  // Normalize versions (remove leading 'v', trim)
  const cleanCurrent = current.replace(/^v/, '').trim()
  const cleanLatest = latest.replace(/^v/, '').trim()

  const currentSemver = parseSemver(cleanCurrent)
  const latestSemver = parseSemver(cleanLatest)

  // Fallback to simple numeric comparison if parsing fails
  if (!currentSemver || !latestSemver) {
    return fallbackCompare(cleanCurrent, cleanLatest)
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
    return false // latest is a pre-release -> not newer than current stable
  }
  if (currentPre.length > 0 && latestPre.length === 0) {
    return true // latest is stable while current is pre-release
  }

  // Both have prerelease identifiers: compare according to semver rules
  return comparePrerelease(currentPre, latestPre) > 0
}

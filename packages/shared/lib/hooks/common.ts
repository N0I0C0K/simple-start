import type { DependencyList } from 'react'
import { useEffect, useState } from 'react'

export function useDebounce<T>(val: T, delay: number = 200): T {
  const [delayVal, setDelayVal] = useState(val)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayVal(val)
    }, delay)
    return () => {
      clearTimeout(timer)
    }
  }, [val, delay])
  return delayVal
}

export function useEffectMemo<T>(func: () => T, defaultVal: T, deps?: DependencyList): T {
  const [val, setVal] = useState<T>(defaultVal)
  useEffect(() => {
    setVal(func())
  }, deps)

  return val
}

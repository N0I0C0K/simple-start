import { clsx, type ClassValue } from 'clsx'
import { useState, useLayoutEffect } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useSize(ref: React.RefObject<Element>): Size {
  const [size, setSize] = useState<Size>([150, window.innerWidth / 2])
  useLayoutEffect(() => {
    if (!ref.current) return
    const obser = new ResizeObserver(ent => {
      const first = ent[0]
      setSize([first.contentRect.height, first.contentRect.width])
    })
    obser.observe(ref.current)
    return () => {
      obser.disconnect()
    }
  }, [ref])
  return size
}
export type Size = [height: number, width: number]

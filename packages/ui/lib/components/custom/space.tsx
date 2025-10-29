import { cn } from '@/lib/utils'

export function Space({ className }: { className?: string }) {
  return <span className={cn('flex-1', className)} />
}

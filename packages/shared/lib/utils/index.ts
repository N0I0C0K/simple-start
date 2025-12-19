export * from './shared-types'

export function WarpDefaultObject<T extends object>(src: Partial<T>, defaultTgt: T): T {
  return new Proxy(src, {
    get(target, p, receiver) {
      if (p in target) {
        const val = Reflect.get(target, p)
        if (val !== undefined) {
          return val
        }
      }
      return Reflect.get(defaultTgt, p)
    },
  }) as T
}

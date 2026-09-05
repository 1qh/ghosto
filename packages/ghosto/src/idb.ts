import { get as rawGet, set as rawSet } from 'idb-keyval'

type IdbGet = <T>(key: string) => Promise<T | undefined>
type IdbSet = (key: string, value: unknown) => Promise<void>
// biome-ignore lint/nursery/noUnsafeTypeAssertion: idb-keyval's exported types are loose; this is the single typed-facade boundary for its get
const get = rawGet as IdbGet
// biome-ignore lint/nursery/noUnsafeTypeAssertion: idb-keyval's exported types are loose; this is the single typed-facade boundary for its set
const set = rawSet as IdbSet
export { get, set }

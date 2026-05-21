import { get as rawGet, set as rawSet } from 'idb-keyval'

type IdbGet = <T>(key: string) => Promise<T | undefined>
type IdbSet = (key: string, value: unknown) => Promise<void>
const get = rawGet as IdbGet
const set = rawSet as IdbSet
export { get, set }

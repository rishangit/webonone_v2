import { randomId } from '@/features/design/utils/randomId'

/** Local id helper matching web `nanoid(10)` usage in website documents. */
export function nanoid(size = 21): string {
  return randomId(size)
}

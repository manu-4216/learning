import { hashKey } from './utils'

type QueryCacheItem =
  | {
      status: 'pending'
    }
  | {
      status: 'success'
      data: any
    }
  | {
      status: 'error'
      error: Error
    }

type Listener = (queryKey: string) => void

// Contains and manages the cache for each queryKey.
// Also it has listeners that will be informed of data changes
export class QueryClient {
  cache: Map<string, QueryCacheItem>
  // The listeners will be used by the Observers to be notified about data changes
  listeners: Set<Listener>

  constructor() {
    this.cache = new Map<string, QueryCacheItem>()
    this.listeners = new Set()
  }

  // add the listener callback to the listeners array
  subscribe(listener) {
    this.listeners.add(listener)
    // return the unsubscribe callback
    return () => this.listeners.delete(listener)
  }

  // get the item from the cache. If not existing, initialise it to 'pending'
  get(queryKey) {
    const hash = hashKey(queryKey)

    if (!this.cache.has(hash)) {
      this.set(queryKey, {
        status: 'pending',
      })
    }

    return this.cache.get(hash)
  }

  set(queryKey, queryItem) {
    const hash = hashKey(queryKey)
    // update the cache item (allow partial update)
    this.cache.set(hash, {
      ...this.cache.get(hash),
      ...queryItem,
    })

    // after an update, notify ALL the listeners about a change in the stored value.
    // Invoke them with the queryKey so that each will know which Query item was updated.
    this.listeners.forEach((listener) => {
      listener(queryKey)
    })
  }

  // NOTE: QueryClient is naive to the implementation details of the request.
  // That's why we use a separate method, obtain, which takes in a queryKey and a queryFn,
  // and then stores the result of that async function in the cache.
  async obtain({ queryKey, queryFn }) {
    try {
      // Use promise property for deduplication: regardless of how many times useQuery is called with
      // the same queryKey, if there's already a queryFn running for that queryKey, it doesn't make sense
      // to call it again.
      if (!this.get(queryKey)?.promise) {
        // call the function
        const promise = queryFn()
        this.set(queryKey, { promise }) // save the current promise. The rest of the stored item will stay unchanged (see how set is implemented)
        const data = await promise
        this.set(queryKey, {
          status: 'success',
          data,
          promise: undefined, // reset the current promise
        })
      }
    } catch (error) {
      this.set(queryKey, {
        status: 'error',
        error,
        promise: undefined, // reset the current promise
      })
    }
  }
}

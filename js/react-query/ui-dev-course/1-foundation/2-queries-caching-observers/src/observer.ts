import { hashKey } from './utils'
import { QueryClient } from './query-client'
import type { Options } from './types'

// An observer helps React components subscribe to individual entries in the cache and be notified when they change
// In a way, you can think of them as middleware that allow React components to subscribe to individual entries in the cache, at a specific queryKey.
export function createObserver(queryClient: QueryClient, options: Options) {
  return {
    // notify is a callback to notify when the React component should trigger a re-render.
    subscribe(notify: () => void) {
      // First create the listener, and pass the callback that will react when the cache key will change.
      // Call the subscribe callback you give it (notify).
      // When that notify callback function is invoked, React will then invoke the getSnapshot function.
      const unsubscribe = queryClient.subscribe((queryKey) => {
        // If the cache gets updated for that queryKey, call the notify callback.
        if (hashKey(options.queryKey) === hashKey(queryKey)) {
          notify()
        }
      })

      // initiate a fetch.
      // NOTE: Each component has its own observer (created with useQuery)
      queryClient.obtain(options)

      return unsubscribe
    },
    getSnapshot() {
      return queryClient.get(options.queryKey)
    },
  }
}

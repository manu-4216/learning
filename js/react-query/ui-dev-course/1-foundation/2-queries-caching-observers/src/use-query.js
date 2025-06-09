import * as React from 'react'
import { createObserver } from './observer'
import { QueryClientContext } from './context'

export function useQuery(options) {
  const queryClient = React.useContext(QueryClientContext)
  const optionsRef = React.useRef(options)

  // create a stable ref for the observer
  const observer = React.useMemo(() => {
    // subscribe to a specific queryKey in the cache
    return createObserver(queryClient, optionsRef.current)
  }, [queryClient])

  // useSyncExternalStore allows you to subscribe to state that is managed outside of React (our cache),
  // and trigger a re-render whenever that state changes.
  // It takes in two arguments, subscribe and getSnapshot.
  // It returns the current state of the data in the storem using getSnapshot method.
  return React.useSyncExternalStore(observer.subscribe, observer.getSnapshot)
}
